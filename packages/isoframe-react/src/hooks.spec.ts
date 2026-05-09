import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFrame } from './hooks/useFrame';
import { useSorted } from './hooks/useSorted';
import { usePaginated } from './hooks/usePaginated';
import { IsoFrame } from '@nice-tools/isoframe';

const sampleRows = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Carol', age: 35 },
];

describe('useFrame', () => {
  it('returns null frame when no initial data is provided', () => {
    const { result } = renderHook(() => useFrame());
    expect(result.current.frame).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('initialises frame from provided data', () => {
    const { result } = renderHook(() => useFrame(sampleRows));
    expect(result.current.frame).not.toBeNull();
    expect(result.current.frame?.shape[0]).toBe(3);
  });

  it('setData updates the frame', () => {
    const { result } = renderHook(() => useFrame());
    act(() => {
      result.current.setData(sampleRows);
    });
    expect(result.current.frame?.shape[0]).toBe(3);
  });

  it('setData sets error on invalid input', () => {
    const { result } = renderHook(() => useFrame());
    act(() => {
      // A plain string is not a valid FrameInput and will throw inside IsoFrame
      result.current.setData('not-valid' as unknown as Parameters<typeof result.current.setData>[0]);
    });
    expect(result.current.error).not.toBeNull();
  });
});

describe('useSorted', () => {
  it('returns null when frame is null', () => {
    const { result } = renderHook(() => useSorted(null, 'age'));
    expect(result.current).toBeNull();
  });

  it('returns original frame when sort key is null', () => {
    const frame = new IsoFrame(sampleRows);
    const { result } = renderHook(() => useSorted(frame, null));
    expect(result.current).toBe(frame);
  });

  it('returns sorted frame ascending by age', () => {
    const frame = new IsoFrame(sampleRows);
    const { result } = renderHook(() => useSorted(frame, 'age', true));
    const rows = result.current!.to_list();
    expect(rows[0].age).toBe(25);
    expect(rows[2].age).toBe(35);
  });

  it('returns sorted frame descending by age', () => {
    const frame = new IsoFrame(sampleRows);
    const { result } = renderHook(() => useSorted(frame, 'age', false));
    const rows = result.current!.to_list();
    expect(rows[0].age).toBe(35);
  });
});

describe('usePaginated', () => {
  it('returns null page when frame is null', () => {
    const { result } = renderHook(() => usePaginated(null, 1, 10));
    expect(result.current.page).toBeNull();
    expect(result.current.totalRows).toBe(0);
    expect(result.current.totalPages).toBe(0);
  });

  it('returns correct page slice', () => {
    const frame = new IsoFrame(sampleRows);
    const { result } = renderHook(() => usePaginated(frame, 1, 2));
    expect(result.current.page?.shape[0]).toBe(2);
    expect(result.current.totalRows).toBe(3);
    expect(result.current.totalPages).toBe(2);
  });

  it('clamps page number to valid range', () => {
    const frame = new IsoFrame(sampleRows);
    const { result } = renderHook(() => usePaginated(frame, 99, 2));
    expect(result.current.page?.shape[0]).toBeGreaterThan(0);
  });
});
