import { useState, useEffect } from 'react';
import type { IIsoFrame, Row } from '@nice-tools/isoframe';

export function useFiltered(
  frame: IIsoFrame | null,
  predicate: ((row: Row, index: number) => boolean) | null,
): { filtered: IIsoFrame | null; loading: boolean } {
  const [filtered, setFiltered] = useState<IIsoFrame | null>(frame);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!frame || !predicate) {
      setFiltered(frame);
      return;
    }
    let cancelled = false;
    setLoading(true);
    frame.where(predicate).then((result) => {
      if (!cancelled) {
        setFiltered(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [frame, predicate]);

  return { filtered, loading };
}
