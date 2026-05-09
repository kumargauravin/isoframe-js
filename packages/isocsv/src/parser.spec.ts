import { describe, it, expect } from 'vitest';
import { parseCSV, stringifyCSV } from './parser';

describe('parseCSV', () => {
  it('parses basic CSV', () => {
    const csv = 'id,name,age\n1,Alice,30\n2,Bob,25';
    const { rows, columns } = parseCSV(csv);
    expect(columns).toEqual(['id', 'name', 'age']);
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('Alice');
    expect(rows[0].age).toBe(30); // inferred number
  });

  it('handles quoted fields with commas', () => {
    const csv = 'name,desc\nAlice,"Hello, World"';
    const { rows } = parseCSV(csv);
    expect(rows[0].desc).toBe('Hello, World');
  });

  it('handles TSV delimiter', () => {
    const tsv = 'a\tb\n1\t2';
    const { rows } = parseCSV(tsv, { delimiter: '\t' });
    expect(rows[0].b).toBe(2);
  });

  it('handles no-header mode', () => {
    const csv = '1,Alice\n2,Bob';
    const { rows, columns } = parseCSV(csv, { header: false });
    expect(columns).toEqual(['col0', 'col1']);
    expect(rows[0].col1).toBe('Alice');
  });

  it('stringifyCSV roundtrip', () => {
    const rows = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob, Jr.' }];
    const csv = stringifyCSV(rows);
    const { rows: parsed } = parseCSV(csv);
    expect(parsed[1].name).toBe('Bob, Jr.');
  });
});
