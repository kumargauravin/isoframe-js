import { describe, it, expect } from 'vitest';
import { flatten_json, flatten_records } from './flatten';
import { coerce_schema, coerce_records } from './coerce';
import { from_cosmosdb, from_cosmosdb_records } from './cosmosdb';

describe('flatten_json', () => {
  it('flattens nested objects', () => {
    const result = flatten_json({ a: { b: { c: 1 } }, d: 2 });
    expect(result['a.b.c']).toBe(1);
    expect(result['d']).toBe(2);
  });

  it('custom separator', () => {
    const result = flatten_json({ a: { b: 1 } }, { separator: '__' });
    expect(result['a__b']).toBe(1);
  });

  it('maxDepth limits flattening', () => {
    const result = flatten_json({ a: { b: { c: 1 } } }, { maxDepth: 1 });
    expect(result['a.b']).toBeDefined();
    expect(result['a.b.c']).toBeUndefined();
  });

  it('handles null values', () => {
    const result = flatten_json({ a: null, b: 1 });
    expect(result['a']).toBeNull();
  });

  it('primitive arrays as CSV', () => {
    const result = flatten_json({ tags: ['a', 'b', 'c'] }, { arrayAsCsv: true });
    expect(result['tags']).toBe('a,b,c');
  });

  it('excludes specified keys', () => {
    const result = flatten_json({ a: 1, b: 2 }, { exclude: ['a'] });
    expect(result['a']).toBeUndefined();
    expect(result['b']).toBe(2);
  });
});

describe('flatten_records', () => {
  it('aligns keys across all rows', () => {
    const rows = flatten_records([{ a: 1 }, { b: 2 }]);
    expect(rows[0].b).toBeNull();
    expect(rows[1].a).toBeNull();
  });
});

describe('coerce_schema', () => {
  it('coerces string to number', () => {
    const result = coerce_schema({ age: '25' as any }, { age: 'number' });
    expect(result.age).toBe(25);
  });

  it('coerces string to boolean', () => {
    const result = coerce_schema({ active: 'true' as any }, { active: 'boolean' });
    expect(result.active).toBe(true);
  });

  it('wildcard schema applies to all', () => {
    const result = coerce_schema({ a: '1', b: '2' } as any, { '*': 'number' });
    expect(result.a).toBe(1);
    expect(result.b).toBe(2);
  });

  it('auto-coerces numbers from strings', () => {
    const result = coerce_schema({ x: '3.14' as any }, { x: 'auto' });
    expect(result.x).toBe(3.14);
  });

  it('handles null values', () => {
    const result = coerce_schema({ x: null }, { x: 'number' });
    expect(result.x).toBeNull();
  });
});

describe('from_cosmosdb', () => {
  const cosmosDoc = {
    id: 'abc123',
    name: 'Test',
    address: { city: 'NYC', zip: '10001' },
    _rid: 'xxx',
    _self: '/dbs/...',
    _etag: '"etag"',
    _attachments: 'attachments/',
    _ts: 1234567890,
  };

  it('strips system fields by default', () => {
    const result = from_cosmosdb(cosmosDoc);
    expect(result['_rid']).toBeUndefined();
    expect(result['_ts']).toBeUndefined();
    expect(result['id']).toBe('abc123');
  });

  it('keeps system fields when stripSystem=false', () => {
    const result = from_cosmosdb(cosmosDoc, { stripSystem: false });
    expect(result['_ts']).toBe(1234567890);
  });

  it('flattens nested address', () => {
    const result = from_cosmosdb(cosmosDoc);
    expect(result['address.city']).toBe('NYC');
    expect(result['address.zip']).toBe('10001');
  });
});

describe('from_cosmosdb_records', () => {
  it('processes multiple docs and aligns keys', () => {
    const docs = [
      { id: '1', name: 'Alice', _ts: 100 },
      { id: '2', age: 30, _ts: 200 },
    ];
    const rows = from_cosmosdb_records(docs);
    expect(rows).toHaveLength(2);
    expect(rows[0]['_ts']).toBeUndefined();
    expect(rows[0]['name']).toBe('Alice');
    expect(rows[0]['age']).toBeNull(); // key aligned, filled with null
    expect(rows[1]['name']).toBeNull();
  });
});
