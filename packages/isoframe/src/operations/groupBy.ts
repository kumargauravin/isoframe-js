import { AggFnName, AggSpec, IGroupedFrame, IIsoFrame, Row, Scalar } from '../types';
import { yieldControl } from '../utils/chunk';
import { mean } from '../utils/stats';

export class GroupedFrame implements IGroupedFrame {
  private readonly _keys: string[];
  private readonly _groups: Map<string, Row[]>;
  private readonly _IsoFrameClass: new (rows: Row[]) => IIsoFrame;

  constructor(keys: string[], groups: Map<string, Row[]>, IsoFrameClass: new (rows: Row[]) => IIsoFrame) {
    this._keys = keys;
    this._groups = groups;
    this._IsoFrameClass = IsoFrameClass;
  }

  private async _reduce(
    fn: (groupKey: string, groupRows: Row[]) => Row,
  ): Promise<IIsoFrame> {
    const rows: Row[] = [];
    let i = 0;
    for (const [groupKey, groupRows] of this._groups) {
      rows.push(fn(groupKey, groupRows));
      i++;
      if (i % 500 === 0) await yieldControl();
    }
    return new this._IsoFrameClass(rows);
  }

  private _parseGroupKey(groupKey: string): Record<string, Scalar> {
    // groupKey is JSON-encoded key array
    const vals: Scalar[] = JSON.parse(groupKey);
    const result: Record<string, Scalar> = {};
    for (let i = 0; i < this._keys.length; i++) {
      result[this._keys[i]] = vals[i];
    }
    return result;
  }

  async sum(col: string): Promise<IIsoFrame> {
    return this._reduce((gk, rows) => ({
      ...this._parseGroupKey(gk),
      [`${col}_sum`]: rows.reduce((acc, r) => acc + (typeof r[col] === 'number' ? (r[col] as number) : 0), 0),
    }));
  }

  async mean(col: string): Promise<IIsoFrame> {
    return this._reduce((gk, rows) => {
      const nums = rows.map((r) => r[col]).filter((v): v is number => typeof v === 'number');
      return {
        ...this._parseGroupKey(gk),
        [`${col}_mean`]: nums.length ? mean(nums) : null,
      };
    });
  }

  async count(): Promise<IIsoFrame> {
    return this._reduce((gk, rows) => ({
      ...this._parseGroupKey(gk),
      count: rows.length,
    }));
  }

  async min(col: string): Promise<IIsoFrame> {
    return this._reduce((gk, rows) => {
      const nums = rows.map((r) => r[col]).filter((v): v is number => typeof v === 'number');
      return {
        ...this._parseGroupKey(gk),
        [`${col}_min`]: nums.length ? Math.min(...nums) : null,
      };
    });
  }

  async max(col: string): Promise<IIsoFrame> {
    return this._reduce((gk, rows) => {
      const nums = rows.map((r) => r[col]).filter((v): v is number => typeof v === 'number');
      return {
        ...this._parseGroupKey(gk),
        [`${col}_max`]: nums.length ? Math.max(...nums) : null,
      };
    });
  }

  async first(col: string): Promise<IIsoFrame> {
    return this._reduce((gk, rows) => ({
      ...this._parseGroupKey(gk),
      [`${col}_first`]: rows[0]?.[col] ?? null,
    }));
  }

  async last(col: string): Promise<IIsoFrame> {
    return this._reduce((gk, rows) => ({
      ...this._parseGroupKey(gk),
      [`${col}_last`]: rows[rows.length - 1]?.[col] ?? null,
    }));
  }

  async agg(spec: AggSpec): Promise<IIsoFrame> {
    return this._reduce((gk, rows) => {
      const keyParts = this._parseGroupKey(gk);
      const result: Row = { ...keyParts };
      for (const [col, fn] of Object.entries(spec)) {
        if (typeof fn === 'function') {
          result[col] = fn(rows);
        } else {
          const nums = rows.map((r) => r[col]).filter((v): v is number => typeof v === 'number');
          switch (fn) {
            case 'sum': result[`${col}_${fn}`] = nums.reduce((a, b) => a + b, 0); break;
            case 'mean': result[`${col}_${fn}`] = nums.length ? mean(nums) : null; break;
            case 'count': result[`${col}_${fn}`] = rows.length; break;
            case 'min': result[`${col}_${fn}`] = nums.length ? Math.min(...nums) : null; break;
            case 'max': result[`${col}_${fn}`] = nums.length ? Math.max(...nums) : null; break;
            case 'first': result[`${col}_${fn}`] = rows[0]?.[col] ?? null; break;
            case 'last': result[`${col}_${fn}`] = rows[rows.length - 1]?.[col] ?? null; break;
          }
        }
      }
      return result;
    });
  }

  async custom(fn: (rows: Row[]) => Row): Promise<IIsoFrame> {
    return this._reduce((_gk, rows) => fn(rows));
  }
}

/** Build group map from rows */
export async function buildGroups(
  rows: ReadonlyArray<Row>,
  keys: string[],
): Promise<Map<string, Row[]>> {
  const groups = new Map<string, Row[]>();
  let i = 0;
  for (const row of rows) {
    const groupKey = JSON.stringify(keys.map((k) => row[k]));
    const bucket = groups.get(groupKey);
    if (bucket) {
      bucket.push(row as Row);
    } else {
      groups.set(groupKey, [row as Row]);
    }
    i++;
    if (i % 10_000 === 0) await yieldControl();
  }
  return groups;
}
