import { toCanvas } from 'html-to-image';

// 58mm printer: 8 dots/mm × 48mm printable = 384 dots wide
const PRINT_WIDTH = 384;

// BLE UART profiles for common 58mm thermal printers (tried in order)
const BLE_PROFILES = [
  {
    // ISSC transparent UART — Xprinter, GOOJPRT, most Chinese 58mm printers
    service:  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
    writeChr: '49535343-8841-43f4-a8d4-ecbe34729bb3',
  },
  {
    // Nordic UART — used by many reference-design printers
    service:  '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    writeChr: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  },
] as const;

// ── Step 1: Render full HTML receipt → monochrome HTMLCanvasElement ──────────

async function htmlToMonochromeCanvas(html: string): Promise<HTMLCanvasElement> {
  // Render into an off-screen iframe so Google Fonts load and CSS executes
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    `position:fixed;left:-9999px;top:0;width:${PRINT_WIDTH}px;height:5000px;` +
    `border:0;visibility:hidden;`;
  document.body.appendChild(iframe);

  const iDoc = iframe.contentDocument ?? iframe.contentWindow!.document;
  iDoc.open();
  iDoc.write(html);
  iDoc.close();

  iDoc.body.style.padding    = '8px';
  iDoc.body.style.margin     = '0';
  iDoc.body.style.boxSizing  = 'content-box';
  iDoc.body.style.background = '#ffffff';

  try {
    await iDoc.fonts.ready;
    // Let font metrics settle so layout is complete before capture
    await new Promise<void>((r) => setTimeout(r, 600));

    // Capture as full-colour canvas at 1:1 pixel ratio
    const colourCanvas = await toCanvas(iDoc.body, {
      pixelRatio: 1,
      backgroundColor: '#ffffff',
    });

    // Resize to exactly PRINT_WIDTH and threshold to 1-bit monochrome
    const mono = document.createElement('canvas');
    mono.width  = PRINT_WIDTH;
    mono.height = colourCanvas.height;
    const ctx = mono.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, mono.width, mono.height);
    ctx.drawImage(colourCanvas, 0, 0, mono.width, mono.height);

    const imgData = ctx.getImageData(0, 0, mono.width, mono.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      // Standard luminance formula; threshold at 180 gives good contrast on cheap printers
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const bw  = lum < 180 ? 0 : 255;
      d[i] = d[i + 1] = d[i + 2] = bw;
      d[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    return mono;
  } finally {
    document.body.removeChild(iframe);
  }
}

// ── Step 2: Canvas → ESC/POS raster byte stream ──────────────────────────────

function canvasToEscPos(canvas: HTMLCanvasElement): Uint8Array {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const widthBytes = Math.ceil(width / 8);
  const { data: pixels } = ctx.getImageData(0, 0, width, height);

  // Pack pixels as 1-bit rows (1 = black, MSB first)
  const rasterData = new Uint8Array(widthBytes * height);
  for (let y = 0; y < height; y++) {
    for (let bx = 0; bx < widthBytes; bx++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = bx * 8 + bit;
        if (x < width) {
          const idx = (y * width + x) * 4;
          if (pixels[idx] < 128) byte |= 1 << (7 - bit);
        }
      }
      rasterData[y * widthBytes + bx] = byte;
    }
  }

  const cmds: number[] = [
    // ESC @ — printer reset
    0x1b, 0x40,
    // ESC a 1 — centre align
    0x1b, 0x61, 0x01,
    // GS v 0 <m> <xL> <xH> <yL> <yH> <data> — raster bit image (universally supported)
    0x1d, 0x76, 0x30, 0x00,
    widthBytes & 0xff, (widthBytes >> 8) & 0xff,
    height    & 0xff, (height     >> 8) & 0xff,
    ...rasterData,
    // 4× LF — advance paper past the print head
    0x0a, 0x0a, 0x0a, 0x0a,
    // GS V 66 0 — partial cut
    0x1d, 0x56, 0x42, 0x00,
  ];

  return Uint8Array.from(cmds);
}

// ── Step 3: Web Bluetooth — device picker, GATT connect, stream bytes ────────

async function connectAndSend(data: Uint8Array): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any;
  if (!nav.bluetooth) {
    throw new Error(
      'Web Bluetooth API সমর্থিত নয়। Chrome বা Edge ব্রাউজার ব্যবহার করুন।'
    );
  }

  // Show browser device picker filtered to known thermal printer services
  const device: BluetoothDevice = await nav.bluetooth.requestDevice({
    filters:          BLE_PROFILES.map((p) => ({ services: [p.service] })),
    optionalServices: BLE_PROFILES.map((p) => p.service),
  });

  const server = await device.gatt!.connect();

  let chr: BluetoothRemoteGATTCharacteristic | null = null;
  for (const profile of BLE_PROFILES) {
    try {
      const svc = await server.getPrimaryService(profile.service);
      chr = await svc.getCharacteristic(profile.writeChr);
      break;
    } catch {
      // this profile not available on this device — try next
    }
  }

  if (!chr) {
    throw new Error(
      'প্রিন্টারের GATT characteristic পাওয়া যায়নি। সমর্থিত প্রিন্টার নয়।'
    );
  }

  // Write in 512-byte chunks; small delay prevents receive-buffer overrun
  const CHUNK = 512;
  for (let i = 0; i < data.length; i += CHUNK) {
    await chr.writeValueWithoutResponse(data.slice(i, i + CHUNK));
    if (i + CHUNK < data.length) {
      await new Promise<void>((r) => setTimeout(r, 20));
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render an HTML receipt string at 58mm (384px) width, threshold it to
 * monochrome, encode as an ESC/POS raster bitmap, and stream it to the
 * selected BLE thermal printer via the Web Bluetooth API.
 *
 * The browser device picker is shown automatically.
 * Requires Chrome/Edge on a secure origin (https or localhost).
 */
export async function thermalPrintReceipt(html: string): Promise<void> {
  const canvas      = await htmlToMonochromeCanvas(html);
  const escPosBytes = canvasToEscPos(canvas);
  await connectAndSend(escPosBytes);
}
