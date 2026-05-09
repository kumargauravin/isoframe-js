import { inferDtype } from './utils/dtype';
import { mean } from './utils/stats';
export class Series {
    name;
    dtype;
    values;
    constructor(name, values) {
        this.name = name;
        this.values = values;
        this.dtype = inferDtype(values);
    }
    unique() {
        return [...new Set(this.values)];
    }
    value_counts() {
        const counts = new Map();
        for (const v of this.values) {
            counts.set(v, (counts.get(v) ?? 0) + 1);
        }
        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([value, count]) => ({ value, count }));
    }
    sum() {
        return this.values.reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);
    }
    mean() {
        const nums = this.values.filter((v) => typeof v === 'number');
        return mean(nums);
    }
    min() {
        const nums = this.values.filter((v) => typeof v === 'number');
        return nums.length ? Math.min(...nums) : null;
    }
    max() {
        const nums = this.values.filter((v) => typeof v === 'number');
        return nums.length ? Math.max(...nums) : null;
    }
    to_list() {
        return [...this.values];
    }
}
//# sourceMappingURL=Series.js.map