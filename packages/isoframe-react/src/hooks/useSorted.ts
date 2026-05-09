import { useMemo } from 'react';
import type { IIsoFrame, SortOrder } from '@nice-tools/isoframe';

export function useSorted(
  frame: IIsoFrame | null,
  key: string | null,
  order: SortOrder = 'asc',
): IIsoFrame | null {
  return useMemo(() => {
    if (!frame || !key) return frame;
    return frame.sortBy(key, order);
  }, [frame, key, order]);
}
