import { useMemo } from 'react';
import type { IIsoFrame } from '@nice-tools/isoframe';

const DEFAULT_PAGE_SIZE = 20;

export interface UsePaginatedResult {
  page: IIsoFrame | null;
  totalPages: number;
  totalRows: number;
}

export function usePaginated(
  frame: IIsoFrame | null,
  pageNumber: number,
  pageSize: number,
): UsePaginatedResult {
  return useMemo(() => {
    if (!frame) return { page: null, totalPages: 0, totalRows: 0 };
    const safePageSize = pageSize > 0 ? Math.floor(pageSize) : DEFAULT_PAGE_SIZE;
    const totalRows = frame.shape[0];
    const totalPages = Math.ceil(totalRows / safePageSize);
    const clampedPage = Math.max(1, Math.min(pageNumber, totalPages || 1));
    const page = frame.paginate(clampedPage, safePageSize);
    return { page, totalPages, totalRows };
  }, [frame, pageNumber, pageSize]);
}
