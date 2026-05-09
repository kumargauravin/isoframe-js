import { describe, it, expect } from 'vitest';
import { IsoFrame } from './IsoFrame';

const sampleRows = [
  { id: 1, name: 'Alice', age: 30, dept: 'Eng', salary: 90000 },
  { id: 2, name: 'Bob', age: 25, dept: 'HR', salary: 60000 },
  { id: 3, name: 'Carol', age: 35, dept: 'Eng', salary: 110000 },
  { id: 4, name: 'Dave', age: 28, dept: 'HR', salary: 65000 },
  { id: 5, name: 'Eve', age: 32, dept: 'Eng', salary: 95000 },
];

const deptRows = [
  { deptName: 'Eng', location: 'NYC' },
  { deptName: 'HR', location: 'LA' },
];

describe('IsoFrame', () => {
  it('constructs from row array', () => {
    const df = new IsoFrame(sampleRows);
    expect(df.shape).toEqual([5, 5]);
    expect(df.columns).toContain('name');
  });

  it('constructs from column-map', () => {
    const df = new IsoFrame({
      id: [1, 2],
      name: ['Alice', 'Bob'],
    });
    expect(df.shape).toEqual([2, 2]);
  });

  it('head/tail', () => {
    const df = new IsoFrame(sampleRows);
    expect(df.head(2).shape[0]).toBe(2);
    expect(df.tail(2).shape[0]).toBe(2);
    expect(df.tail(2).to_list()[0].name).toBe('Dave');
  });

  it('select/drop', () => {
    const df = new IsoFrame(sampleRows);
    const sel = df.select(['id', 'name']);
    expect(sel.columns).toEqual(['id', 'name']);
    const dropped = df.drop(['salary']);
    expect(dropped.columns).not.toContain('salary');
  });

  it('rename', () => {
    const df = new IsoFrame(sampleRows);
    const r = df.rename({ name: 'fullName' });
    expect(r.columns).toContain('fullName');
    expect(r.columns).not.toContain('name');
  });

  it('assign', () => {
    const df = new IsoFrame(sampleRows);
    const m = df.assign('bonus', (row) => (row.salary as number) * 0.1);
    expect(m.to_list()[0].bonus).toBe(9000);
  });

  it('sort_values asc/desc', () => {
    const df = new IsoFrame(sampleRows);
    const asc = df.sort_values('age', true).to_list();
    expect(asc[0].age).toBe(25);
    const desc = df.sort_values('salary', false).to_list();
    expect(desc[0].salary).toBe(110000);
  });

  it('paginate', () => {
    const df = new IsoFrame(sampleRows);
    const page1 = df.paginate(1, 2).to_list();
    const page2 = df.paginate(2, 2).to_list();
    expect(page1).toHaveLength(2);
    expect(page2).toHaveLength(2);
    expect(page1[0].id).toBe(1);
    expect(page2[0].id).toBe(3);
  });

  it('query (async filter)', async () => {
    const df = new IsoFrame(sampleRows);
    const eng = await df.query((row) => row.dept === 'Eng');
    expect(eng.shape[0]).toBe(3);
  });

  it('merge (left hash-join)', async () => {
    const df = new IsoFrame(sampleRows);
    const deptDf = new IsoFrame(deptRows);
    const joined = await df.merge(deptDf, 'dept', 'deptName', 'left');
    expect(joined.shape[0]).toBe(5);
    expect(joined.to_list()[0].location).toBe('NYC');
  });

  it('groupby + sum', async () => {
    const df = new IsoFrame(sampleRows);
    const grouped = await df.groupby('dept');
    const result = await grouped.sum('salary');
    const arr = result.sort_values('dept', true).to_list();
    expect(arr.find((r) => r.dept === 'Eng')?.salary_sum).toBe(295000);
    expect(arr.find((r) => r.dept === 'HR')?.salary_sum).toBe(125000);
  });

  it('groupby + mean', async () => {
    const df = new IsoFrame(sampleRows);
    const grouped = await df.groupby('dept');
    const result = await grouped.mean('salary');
    const arr = result.to_list();
    const eng = arr.find((r) => r.dept === 'Eng');
    expect(eng?.salary_mean).toBeCloseTo(98333.33, 1);
  });

  it('groupby + count', async () => {
    const df = new IsoFrame(sampleRows);
    const grouped = await df.groupby('dept');
    const result = await grouped.count();
    const arr = result.to_list();
    expect(arr.find((r) => r.dept === 'Eng')?.count).toBe(3);
  });

  it('groupby + agg', async () => {
    const df = new IsoFrame(sampleRows);
    const grouped = await df.groupby('dept');
    const result = await grouped.agg({ salary: 'sum', age: 'mean' });
    expect(result.shape[0]).toBe(2);
  });

  it('dropna', () => {
    const df = new IsoFrame([
      { id: 1, val: 10 },
      { id: 2, val: null },
      { id: 3, val: 30 },
    ]);
    expect(df.dropna().shape[0]).toBe(2);
  });

  it('fillna', () => {
    const df = new IsoFrame([{ id: 1, val: null }, { id: 2, val: 5 }]);
    const filled = df.fillna(0);
    expect(filled.to_list()[0].val).toBe(0);
  });

  it('col().unique()', () => {
    const df = new IsoFrame(sampleRows);
    expect(df.col('dept').unique().sort()).toEqual(['Eng', 'HR']);
  });

  it('col().value_counts()', () => {
    const df = new IsoFrame(sampleRows);
    const vc = df.col('dept').value_counts();
    expect(vc[0].count).toBe(3); // Eng appears 3 times
  });

  it('melt', () => {
    const df = new IsoFrame([{ id: 1, a: 10, b: 20 }]);
    const melted = df.melt(['id'], ['a', 'b']);
    expect(melted.shape[0]).toBe(2);
    expect(melted.columns).toContain('variable');
    expect(melted.columns).toContain('value');
  });

  it('concat', () => {
    const df1 = new IsoFrame([{ id: 1 }]);
    const df2 = new IsoFrame([{ id: 2 }]);
    const combined = IsoFrame.concat([df1, df2]);
    expect(combined.shape[0]).toBe(2);
  });

  it('to_dict (column-major)', () => {
    const df = new IsoFrame([{ a: 1, b: 2 }, { a: 3, b: 4 }]);
    const obj = df.to_dict();
    expect(obj.a).toEqual([1, 3]);
    expect(obj.b).toEqual([2, 4]);
  });

  it('describe', () => {
    const df = new IsoFrame(sampleRows);
    const desc = df.describe();
    expect(desc.salary).toHaveProperty('mean');
    expect(desc.salary).toHaveProperty('std');
  });

  it('isna / notna / dropna', () => {
    const df = new IsoFrame([{ a: 1, b: null }, { a: 2, b: 3 }]);
    const isna = df.isna().to_list();
    expect(isna[0].b).toBe(true);
    expect(isna[1].b).toBe(false);
  });
});
