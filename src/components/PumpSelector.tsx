import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePumpContext } from "@/contexts/PumpContext";

const PumpSelector = () => {
  const { pumps, pumpId, selectedSeason, year, seasons, loadingSeasons, setPumpId, setSelectedSeason, setYear } = usePumpContext();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

  // Season dropdown is only active once both pump and year are chosen
  const seasonDisabled = !pumpId || loadingSeasons;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Pump selector */}
      <Select value={pumpId?.toString() ?? ""} onValueChange={(v) => setPumpId(parseInt(v))}>
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

      {/* Year selector — changing year clears season */}
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

      {/* Season selector — inert until pump+year are both set */}
      <Select
        value={selectedSeason?.id.toString() ?? ""}
        onValueChange={(v) => {
          const found = seasons.find((s) => s.id.toString() === v) ?? null;
          setSelectedSeason(found);
        }}
        disabled={seasonDisabled}
      >
        <SelectTrigger className="h-9 w-[130px]">
          <SelectValue placeholder={!pumpId ? "পাম্প বাছুন" : loadingSeasons ? "লোড হচ্ছে..." : "মৌসুম"} />
        </SelectTrigger>
        <SelectContent>
          {!pumpId ? (
            <div className="p-2 text-sm text-muted-foreground">আগে পাম্প বাছুন</div>
          ) : seasons.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">{year} সালে কোনো মৌসুম নেই</div>
          ) : (
            seasons.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>
                {s.seasonNameBengali || s.seasonName}
                {s.isCurrent && " ✓"}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PumpSelector;
