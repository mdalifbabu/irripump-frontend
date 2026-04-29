import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePumpContext, SEASONS } from "@/contexts/PumpContext";

/**
 * Compact Pump / Season / Year selector used in the navbar.
 * Selection is persisted to localStorage via PumpContext.
 */
const PumpSelector = () => {
  const { pumps, pumpId, season, year, setPumpId, setSeason, setYear } = usePumpContext();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={pumpId?.toString() ?? ""}
        onValueChange={(v) => setPumpId(parseInt(v))}
      >
        <SelectTrigger className="h-9 w-[140px] md:w-[170px]">
          <SelectValue placeholder="পাম্প" />
        </SelectTrigger>
        <SelectContent>
          {pumps.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">No pumps</div>
          ) : (
            pumps.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.pumpNameBengali || p.pumpNameEnglish}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Select value={season} onValueChange={(v) => setSeason(v as typeof SEASONS[number])}>
        <SelectTrigger className="h-9 w-[110px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="BORO">বোরো</SelectItem>
          <SelectItem value="AMAN">আমন</SelectItem>
          <SelectItem value="AUS">আউশ</SelectItem>
        </SelectContent>
      </Select>

      <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
        <SelectTrigger className="h-9 w-[90px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PumpSelector;