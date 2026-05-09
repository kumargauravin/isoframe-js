import { Dtype, ISeries, Row, Scalar } from './types';
import { inferDtype } from './utils/dtype';
import { mean } from './utils/stats';

export class Series implements ISeries {
  readonly name: string;
  readonly dtype: Dtype;
  readonly values: Scalar[];

  constructor(name: string, values: Scalar[]) {
    this.name = name;
    this.values = values;
    this.dtype = inferDtype(values);
  }

  unique(): Scalar[] {
    return [...new Set(this.values)];
  }

  value_counts(): Row[] {
    const counts = new Map<Scalar, number>();
    for (const v of this.values) {
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count }));
  }

  sum(): number {
    return this.values.reduce<number>((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);
  }

  mean(): number {
    const nums = this.values.filter((v): v is number => typeof v === 'number');
    return mean(nums);
  }

  min(): Scalar {
    const nums = this.values.filter((v): v is number => typeof v === 'number');
    return nums.length ? Math.min(...nums) : null;
  }

  max(): Scalar {
    const nums = this.values.filter((v): v is number => typeof v === 'number');
    return nums.length ? Math.max(...nums) : null;
  }

  to_list(): Scalar[] {
    return [...this.values];
  }
}
