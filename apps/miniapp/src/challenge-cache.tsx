import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { backendApi } from "./api";
import { getAllChallenges, type OnChainChallenge } from "./contract";

export type IndexedChallenge = OnChainChallenge & { index: number };

type ChallengeCacheContextValue = {
  challenges: IndexedChallenge[];
  progressMap: Record<string, number>;
  loading: boolean;
  error: string;
  hasContractAddress: boolean;
  refreshChallenges: () => Promise<void>;
  getCachedChallenge: (idx: number) => IndexedChallenge | null;
  storeChallenge: (challenge: IndexedChallenge, progress?: number) => void;
};

const ChallengeCacheContext = createContext<ChallengeCacheContextValue | null>(null);

export function ChallengeCacheProvider({ children }: { children: ReactNode }) {
  const [challenges, setChallenges] = useState<IndexedChallenge[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hasContractAddress = Boolean(import.meta.env.VITE_CONTRACT_ADDRESS);

  const refreshChallenges = useCallback(async () => {
    if (!hasContractAddress) return;

    setLoading(true);
    setError("");
    try {
      const [nextChallenges, allProgress] = await Promise.all([
        getAllChallenges(),
        backendApi.getAllProgress().catch(() => ({})),
      ]);
      setChallenges(nextChallenges);
      setProgressMap(allProgress);
    } catch (e: any) {
      console.error("Failed to load challenges:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [hasContractAddress]);

  const getCachedChallenge = useCallback(
    (idx: number) => challenges.find((challenge) => challenge.index === idx) || null,
    [challenges],
  );

  const storeChallenge = useCallback((challenge: IndexedChallenge, progress?: number) => {
    setChallenges((current) => {
      const next = current.filter((entry) => entry.index !== challenge.index);
      next.push(challenge);
      next.sort((a, b) => a.index - b.index);
      return next;
    });

    if (progress != null) {
      setProgressMap((current) => ({
        ...current,
        [String(challenge.index)]: progress,
      }));
    }
  }, []);

  const value = useMemo<ChallengeCacheContextValue>(
    () => ({
      challenges,
      progressMap,
      loading,
      error,
      hasContractAddress,
      refreshChallenges,
      getCachedChallenge,
      storeChallenge,
    }),
    [challenges, progressMap, loading, error, hasContractAddress, refreshChallenges, getCachedChallenge, storeChallenge],
  );

  return (
    <ChallengeCacheContext.Provider value={value}>
      {children}
    </ChallengeCacheContext.Provider>
  );
}

export function useChallengeCache() {
  const context = useContext(ChallengeCacheContext);
  if (!context) {
    throw new Error("useChallengeCache must be used within ChallengeCacheProvider.");
  }
  return context;
}
