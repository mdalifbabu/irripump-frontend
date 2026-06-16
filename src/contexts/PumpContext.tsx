import { createContext, useContext, useEffect, useState, useMemo, ReactNode, useCallback } from "react";
import { pumpApi, seasonApi } from "@/lib/api/client";
import type { Pump, Season } from "@/lib/api/types";
import { useAuth } from "@/contexts/AuthContext";

const PUMP_KEY = "irripump_selected_pump";
const SEASON_KEY = "irripump_selected_season_id";
const YEAR_KEY = "irripump_selected_year";

interface PumpContextType {
  pumps: Pump[];
  pumpId: number | null;
  /** Full Season object for the currently selected season. Null when no season is selected or pump+year not set. */
  selectedSeason: Season | null;
  /** Convenience: selectedSeason?.seasonName ?? "" — kept for backward compat */
  season: string;
  year: number;
  seasons: Season[];
  loadingSeasons: boolean;
  setPumpId: (id: number | null) => void;
  /** Select a season by its Season object. Pass null to clear. */
  setSelectedSeason: (s: Season | null) => void;
  /** Legacy: select a season by name string. */
  setSeason: (name: string) => void;
  /** Setting year clears the selected season and refetches the season list. */
  setYear: (y: number) => void;
  refreshPumps: () => Promise<void>;
  refreshSeasons: () => Promise<void>;
  loadingPumps: boolean;
}

const PumpContext = createContext<PumpContextType | undefined>(undefined);

const readNumber = (key: string): number | null => {
  const v = localStorage.getItem(key);
  if (!v) return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
};

export const PumpProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [loadingPumps, setLoadingPumps] = useState(false);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [pumpId, setPumpIdState] = useState<number | null>(() => readNumber(PUMP_KEY));
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(() => readNumber(SEASON_KEY));
  const [year, setYearState] = useState<number>(
    () => readNumber(YEAR_KEY) || new Date().getFullYear()
  );

  // Derive selectedSeason from the ID + seasons list
  const selectedSeason = useMemo<Season | null>(
    () => seasons.find((s) => s.id === selectedSeasonId) ?? null,
    [seasons, selectedSeasonId]
  );

  // Backward-compat: season name string
  const season = selectedSeason?.seasonName ?? "";

  const setPumpId = useCallback((id: number | null) => {
    setPumpIdState(id);
    // Changing pump clears season — user must re-select for the new pump
    setSelectedSeasonId(null);
    localStorage.removeItem(SEASON_KEY);
    if (id == null) localStorage.removeItem(PUMP_KEY);
    else localStorage.setItem(PUMP_KEY, String(id));
  }, []);

  const setSelectedSeason = useCallback((s: Season | null) => {
    const id = s?.id ?? null;
    setSelectedSeasonId(id);
    if (id == null) localStorage.removeItem(SEASON_KEY);
    else localStorage.setItem(SEASON_KEY, String(id));
  }, []);

  // Legacy compat: find by name
  const setSeason = useCallback((name: string) => {
    const found = seasons.find((s) => s.seasonName === name) ?? null;
    setSelectedSeason(found);
  }, [seasons, setSelectedSeason]);

  const setYear = useCallback((y: number) => {
    setYearState(y);
    localStorage.setItem(YEAR_KEY, String(y));
    // Changing year clears season — season list will refetch via useEffect
    setSelectedSeasonId(null);
    localStorage.removeItem(SEASON_KEY);
  }, []);

  const refreshPumps = useCallback(async () => {
    setLoadingPumps(true);
    try {
      const data = user?.role === "ADMIN"
        ? await pumpApi.getAll()
        : await pumpApi.getAssigned();
      setPumps(data);
      if (data.length > 0) {
        const stored = readNumber(PUMP_KEY);
        const valid = stored && data.some((p) => p.id === stored);
        if (!valid) {
          setPumpIdState(data[0].id);
          localStorage.setItem(PUMP_KEY, String(data[0].id));
        }
      }
    } catch (e) {
      console.error("Failed to load pumps", e);
    } finally {
      setLoadingPumps(false);
    }
  }, [user]);

  const refreshSeasons = useCallback(async () => {
    // Season list requires both pump and year
    if (!pumpId || !year) {
      setSeasons([]);
      return;
    }
    setLoadingSeasons(true);
    try {
      const data = await seasonApi.getByPumpAndYear(pumpId, year);
      setSeasons(data);
      // Restore stored season if still valid; otherwise pick current/first
      const storedId = readNumber(SEASON_KEY);
      const storedStillValid = storedId && data.some((s) => s.id === storedId);
      if (!storedStillValid) {
        const pick = data.find((s) => s.isCurrent) ?? data[0] ?? null;
        setSelectedSeasonId(pick?.id ?? null);
        if (pick) localStorage.setItem(SEASON_KEY, String(pick.id));
        else localStorage.removeItem(SEASON_KEY);
      }
    } catch (e) {
      console.error("Failed to load seasons", e);
      setSeasons([]);
    } finally {
      setLoadingSeasons(false);
    }
  }, [pumpId, year]);

  useEffect(() => {
    if (isAuthenticated && user) refreshPumps();
  }, [isAuthenticated, user, refreshPumps]);

  // Refetch seasons whenever pump or year changes
  useEffect(() => {
    if (pumpId && year) refreshSeasons();
    else setSeasons([]);
  }, [pumpId, year, refreshSeasons]);

  return (
    <PumpContext.Provider
      value={{
        pumps, pumpId, selectedSeason, season, year, seasons, loadingSeasons,
        setPumpId, setSelectedSeason, setSeason, setYear,
        refreshPumps, refreshSeasons, loadingPumps,
      }}
    >
      {children}
    </PumpContext.Provider>
  );
};

export const usePumpContext = () => {
  const ctx = useContext(PumpContext);
  if (!ctx) throw new Error("usePumpContext must be used within PumpProvider");
  return ctx;
};
