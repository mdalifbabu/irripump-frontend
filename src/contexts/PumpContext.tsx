import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { pumpApi } from "@/lib/api/client";
import type { Pump } from "@/lib/api/types";
import { useAuth } from "@/contexts/AuthContext";

const PUMP_KEY = "irripump_selected_pump";
const SEASON_KEY = "irripump_selected_season";
const YEAR_KEY = "irripump_selected_year";

export const SEASONS = ["BORO", "AMAN", "AUS"] as const;
export type Season = (typeof SEASONS)[number];

interface PumpContextType {
  pumps: Pump[];
  pumpId: number | null;
  season: Season;
  year: number;
  setPumpId: (id: number | null) => void;
  setSeason: (s: Season) => void;
  setYear: (y: number) => void;
  refreshPumps: () => Promise<void>;
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
  const { isAuthenticated } = useAuth();
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [loadingPumps, setLoadingPumps] = useState(false);

  const [pumpId, setPumpIdState] = useState<number | null>(() => readNumber(PUMP_KEY));
  const [season, setSeasonState] = useState<Season>(
    () => (localStorage.getItem(SEASON_KEY) as Season) || "BORO"
  );
  const [year, setYearState] = useState<number>(
    () => readNumber(YEAR_KEY) || new Date().getFullYear()
  );

  const setPumpId = useCallback((id: number | null) => {
    setPumpIdState(id);
    if (id == null) localStorage.removeItem(PUMP_KEY);
    else localStorage.setItem(PUMP_KEY, String(id));
  }, []);

  const setSeason = useCallback((s: Season) => {
    setSeasonState(s);
    localStorage.setItem(SEASON_KEY, s);
  }, []);

  const setYear = useCallback((y: number) => {
    setYearState(y);
    localStorage.setItem(YEAR_KEY, String(y));
  }, []);

  const refreshPumps = useCallback(async () => {
    setLoadingPumps(true);
    try {
      const data = await pumpApi.getAll();
      setPumps(data);
      // Default to first pump if nothing selected (or stored id no longer exists)
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
  }, []);

  useEffect(() => {
    if (isAuthenticated) refreshPumps();
  }, [isAuthenticated, refreshPumps]);

  return (
    <PumpContext.Provider
      value={{ pumps, pumpId, season, year, setPumpId, setSeason, setYear, refreshPumps, loadingPumps }}
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