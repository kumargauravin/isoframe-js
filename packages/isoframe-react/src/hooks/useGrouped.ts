import { useState, useEffect } from 'react';
import type { IGroupedFrame, IIsoFrame } from '@nice-tools/isoframe';

export function useGrouped(
  frame: IIsoFrame | null,
  keys: string | string[] | null,
): { grouped: IGroupedFrame | null; loading: boolean } {
  const [grouped, setGrouped] = useState<IGroupedFrame | null>(null);
  const [loading, setLoading] = useState(false);
  const keyStr = Array.isArray(keys) ? keys.join(',') : keys;

  useEffect(() => {
    if (!frame || !keys) {
      setGrouped(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    frame.groupby(keys).then((g) => {
      if (!cancelled) {
        setGrouped(g);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [frame, keyStr]);

  return { grouped, loading };
}
