// Single source of truth for the farmer-portal URL, mirrored exactly in Flutter
// (lib/core/utils/farmer_portal_url.dart). Token-first — the QR/invoice case — with a graceful
// fallback to the legacy code-only shape for callers that don't have a token yet.
const FARMER_PORTAL_BASE = "https://www.irripump.com/farmer";

export function buildFarmerPortalUrl(opts: {
  portalToken?: string | null;
  farmerCode?: string | null;
}): string {
  if (opts.portalToken) {
    return `${FARMER_PORTAL_BASE}?token=${encodeURIComponent(opts.portalToken)}`;
  }
  return `${FARMER_PORTAL_BASE}?code=${encodeURIComponent(opts.farmerCode ?? "")}`;
}
