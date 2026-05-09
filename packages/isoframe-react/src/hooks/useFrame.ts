import { useState, useCallback } from 'react';
import { IsoFrame } from '@nice-tools/isoframe';
import type { FrameInput, IIsoFrame } from '@nice-tools/isoframe';

export interface UseFrameResult {
  frame: IIsoFrame | null;
  loading: boolean;
  error: Error | null;
  setData: (input: FrameInput) => void;
}

export function useFrame(initialData?: FrameInput): UseFrameResult {
  const [frame, setFrame] = useState<IIsoFrame | null>(
    initialData ? new IsoFrame(initialData) : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setData = useCallback((input: FrameInput) => {
    try {
      setLoading(true);
      setError(null);
      setFrame(new IsoFrame(input));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  return { frame, loading, error, setData };
}
