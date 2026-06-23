import { createContext, type ReactNode, use, useEffect, useRef, useState } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

interface FlagData {
  name: string;
  enabled: boolean;
}

interface FeatureFlagContextType {
  getFeatureFlag: (name: string) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  getFeatureFlag: () => false,
});

const FF_URL = (import.meta.env.VITE_FEATURE_FLAG_URL as string | undefined) ?? 'http://localhost:8081';
const FF_API_KEY = (import.meta.env.VITE_FEATURE_FLAG_API_KEY as string | undefined) ?? '';

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!FF_API_KEY) {
      console.warn(
        'VITE_FEATURE_FLAG_API_KEY is not set — all flags will be false'
      );
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
          const map: Record<string, boolean> = {};
          for (const f of data.flags) map[f.name] = f.enabled;
          setFlags(map);
        } else if (ev.event === 'patch') {
          const patch = JSON.parse(ev.data) as FlagData;
          setFlags(prev => ({ ...prev, [patch.name]: patch.enabled }));
        }
      },
      onerror(err) {
        console.error('Feature flag SSE error', err);
      },
    });

    return () => ctrl.abort();
  }, []);

  const getFeatureFlag = (name: string) => flags[name] ?? false;

  return (
    <FeatureFlagContext.Provider value={{ getFeatureFlag }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  return use(FeatureFlagContext);
}
