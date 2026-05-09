import { useMemo } from 'react';
import type { IIsoFrame } from '@nice-tools/isoframe';

export function useSorted(
  frame: IIsoFrame | null,
  key: string | null,
  ascending = true,
): IIsoFrame | null {
  return useMemo(() => {
    if (!frame || !key) return frame;
    return frame.sort_values(key, ascending);
  }, [frame, key, ascending]);
}
