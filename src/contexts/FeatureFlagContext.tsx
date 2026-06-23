import { createContext, type ReactNode, use, useEffect, useMemo, useRef, useState } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

interface FlagData {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  flagOverrides: { userId: string; override: boolean }[];
}

interface CachedFlag {
  enabled: boolean;
  rolloutPercentage: number;
  overrides: Record<string, boolean>;
}

interface FeatureFlagContextType {
  getFeatureFlag: (name: string, userId: string) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  getFeatureFlag: () => false,
});

const FF_URL = (import.meta.env.VITE_FEATURE_FLAG_URL as string | undefined) ?? 'http://localhost:8081';
const FF_API_KEY = (import.meta.env.VITE_FEATURE_FLAG_API_KEY as string | undefined) ?? '';

// MurmurHash3 32-bit — matches the Kotlin FeatureFlagClient bucket algorithm exactly.
const encoder = new TextEncoder();
function murmur3(key: string, seed = 0): number {
  const data = encoder.encode(key);
  const len = data.length;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  let h1 = seed;

  const numBlocks = Math.trunc(len / 4);
  for (let i = 0; i < numBlocks; i++) {
    const b = i * 4;
    let k1 = data[b] | (data[b + 1] << 8) | (data[b + 2] << 16) | (data[b + 3] << 24);
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);
    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    // | 0 is signed int32 wrapping (not truncation) — Math.trunc would be wrong here
    h1 = (Math.imul(h1, 5) + -430675100) | 0; // eslint-disable-line unicorn/prefer-math-trunc
  }

  const tail = numBlocks * 4;
  const rem = len & 3;
  if (rem > 0) {
    let k1 = 0;
    if (rem >= 3) k1 ^= data[tail + 2] << 16;
    if (rem >= 2) k1 ^= data[tail + 1] << 8;
    k1 ^= data[tail];
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);
    h1 ^= k1;
  }

  h1 ^= len;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;
  return h1;
}

function bucket(flagName: string, userId: string): number {
  return (murmur3(`${flagName}:${userId}`) & 0x7fffffff) % 100;
}

function toCachedFlag(f: FlagData): CachedFlag {
  return {
    enabled: f.enabled,
    rolloutPercentage: f.rolloutPercentage,
    overrides: Object.fromEntries((f.flagOverrides ?? []).map(o => [o.userId, o.override])),
  };
}

export function FeatureFlagProvider({ children }: { readonly children: ReactNode }) {
  const [flags, setFlags] = useState<Record<string, CachedFlag>>({});
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!FF_API_KEY) {
      console.warn('VITE_FEATURE_FLAG_API_KEY is not set — all flags will be false');
      return;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // Calling the feature-flag-service-kotlin repo
    void fetchEventSource(`${FF_URL}/stream`, {
      headers: { Authorization: `Bearer ${FF_API_KEY}` },
      signal: ctrl.signal,
      onmessage(ev) {
        if (ev.event === 'put') {
          const data = JSON.parse(ev.data) as { flags: FlagData[] };
          const map: Record<string, CachedFlag> = {};
          for (const f of data.flags) map[f.name] = toCachedFlag(f);
          setFlags(map);
        } else if (ev.event === 'patch') {
          const patch = JSON.parse(ev.data) as FlagData;
          setFlags(prev => ({ ...prev, [patch.name]: toCachedFlag(patch) }));
        }
      },
      onerror(err) {
        console.error('Feature flag SSE error', err);
      },
    });

    return () => ctrl.abort();
  }, []);

  const value = useMemo<FeatureFlagContextType>(() => ({
    getFeatureFlag(name: string, userId: string): boolean {
      const flag = flags[name];
      if (!flag?.enabled) return false;
      if (userId in flag.overrides) return flag.overrides[userId];
      return bucket(name, userId) < flag.rolloutPercentage;
    },
  }), [flags]);

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
