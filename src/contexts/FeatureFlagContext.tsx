import { createContext, type ReactNode, use, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { bucket } from '../utils/featureFlagBucket';

interface FlagData {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  flagOverrides: { userId: string; override: boolean }[];
}

type UserId = string;
interface CachedFlag {
  enabled: boolean;
  rolloutPercentage: number;
  overrides: Record<UserId, boolean>;
}

interface FeatureFlagContextType {
  getFeatureFlag: (name: string) => boolean;
}



const FeatureFlagContext = createContext<FeatureFlagContextType>({
  getFeatureFlag: () => false,
});

const FF_URL = (import.meta.env.VITE_FEATURE_FLAG_URL as string | undefined) ?? 'http://localhost:8081';
const FF_API_KEY = (import.meta.env.VITE_FEATURE_FLAG_API_KEY as string | undefined) ?? '';


function toCachedFlag(f: FlagData): CachedFlag {
  return {
    enabled: f.enabled,
    rolloutPercentage: f.rolloutPercentage,
    overrides: Object.fromEntries((f.flagOverrides ?? []).map(o => [o.userId, o.override])),
  };
}

export function FeatureFlagProvider({ children }: { readonly children: ReactNode }) {
  /*
  * About anonymous users for FF eval: The individual user of a task management app will be identified 
  * by what organization they are logged in as. So there won't be any anonymous users.
  * */
  const { orgId } = useAuth();
  const [flags, setFlags] = useState<Record<string, CachedFlag>>({});

  useEffect(() => {
    if (!FF_API_KEY) {
      console.warn('VITE_FEATURE_FLAG_API_KEY is not set — all flags will be false');
      return;
    }

    const ctrl = new AbortController();

    fetch(`${FF_URL}/flags`, {
      headers: { Authorization: `Bearer ${FF_API_KEY}` },
      signal: ctrl.signal,
    })
      .then(res => res.json() as Promise<FlagData[]>)
      .then(data => {
        const map: Record<UserId, CachedFlag> = {};
        for (const f of data) map[f.name] = toCachedFlag(f);
        setFlags(map);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Feature flag fetch error', err);
      });

    return () => ctrl.abort();
  }, []);

  const value = useMemo<FeatureFlagContextType>(() => ({
    getFeatureFlag(name: string): boolean {
      const flag = flags[name];
      if (!flag?.enabled) return false;
      if (orgId in flag.overrides) return flag.overrides[orgId];
      return bucket(name, orgId) < flag.rolloutPercentage;
    },
  }), [flags, orgId]);

  return (
    <FeatureFlagContext value={value}>
      {children}
    </FeatureFlagContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFeatureFlags() {
  return use(FeatureFlagContext);
}
