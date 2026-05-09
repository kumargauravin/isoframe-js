# isoframe-js

> A zero-dependency, isomorphic (Node + Browser) DataFrame ecosystem for dashboarding, complex JSON joins, and CSV parsing — built in TypeScript and designed for React 19 / Next.js apps.

---

## Packages

| Package | Version | Description |
|---|---|---|
| [`@nice-tools/isoframe`](packages/isoframe) | 0.1.0 | Core DataFrame — zero deps, isomorphic |
| [`@nice-tools/isocsv`](packages/isocsv) | 0.1.0 | RFC 4180 CSV/TSV parser — zero deps, isomorphic |
| [`@nice-tools/isoframe-react`](packages/isoframe-react) | 0.1.0 | React 19 hooks for IsoFrame |
| [`demo-react`](apps/demo-react) | — | Next.js 15 demo app with AG Grid |

---

## Architecture

```
isoframe-js/                  ← NX monorepo root
├── packages/
│   ├── isoframe/             ← @nice-tools/isoframe  (core)
│   │   └── src/
│   │       ├── IsoFrame.ts   ← main class (immutable row model)
│   │       ├── Series.ts     ← single-column accessor
│   │       ├── types.ts      ← all public types & interfaces
│   │       ├── operations/   ← join, groupBy, filter, sort, paginate
│   │       └── utils/        ← normalize, dtype, stats, chunk
│   ├── isocsv/               ← @nice-tools/isocsv
│   │   └── src/
│   │       ├── parser.ts     ← RFC 4180 parser + stringifier
│   │       └── types.ts
│   └── isoframe-react/       ← @nice-tools/isoframe-react
│       └── src/hooks/        ← useFrame, useSorted, useFiltered, usePaginated, useGrouped
└── apps/
    └── demo-react/           ← Next.js 15 demo (AG Grid dashboard)
```

### Key design decisions

- **Immutable rows** — every row is `Object.freeze()`d; transformations return new frames
- **Hash-Join O(n+m)** — not O(n×m); scales to hundreds of thousands of rows
- **Async chunking** — `where()` / `groupBy()` yield to the event loop every 5 000–10 000 rows to avoid blocking the main thread in a browser
- **Dual CJS+ESM output** — each library builds both `dist/esm` and `dist/cjs` with TypeScript declarations in `dist/types`
- **Zero runtime dependencies** — `@nice-tools/isoframe` and `@nice-tools/isocsv` have no `dependencies` at all

---

## Quick Start

```bash
npm install          # install all workspace packages
npm run build        # build all packages (NX)
npm run test         # run all tests (vitest)
npm run demo         # start Next.js demo on http://localhost:3000
```

---

## `@nice-tools/isoframe` API

### Constructor

```ts
import { IsoFrame } from '@nice-tools/isoframe';

// From row array
const df = new IsoFrame([
  { id: 1, name: 'Alice', salary: 90000 },
  { id: 2, name: 'Bob',   salary: 60000 },
]);

// From column-major map
const df2 = new IsoFrame({
  id:     [1, 2],
  name:   ['Alice', 'Bob'],
  salary: [90000, 60000],
});
```

### Shape & Metadata

| Property / Method | Returns | Description |
|---|---|---|
| `.shape` | `[number, number]` | `[rows, columns]` |
| `.columns` | `string[]` | Column names |
| `.dtypes` | `DtypeMap` | Inferred dtype per column |
| `.info()` | `void` | Prints shape + non-null counts |
| `.describe()` | object | Stats (mean, std, min, quartiles, max) for numeric cols |

### Inspection

```ts
df.head(5)          // first N rows → new IsoFrame
df.tail(5)          // last N rows
df.sample(10)       // random N rows (Fisher-Yates)
df.clone()          // deep copy
```

### Selection & Wrangling

```ts
df.select(['id', 'name'])              // keep only these columns
df.drop(['salary'])                    // drop these columns
df.rename({ name: 'fullName' })        // rename columns
df.mutate('bonus', row => row.salary * 0.1)  // add/overwrite column
df.apply(row => ({ ...row, fullName: `${row.first} ${row.last}` }))
```

### Sorting & Pagination

```ts
df.sortBy('salary', 'desc')            // sync, returns new IsoFrame
df.paginate(pageNumber, pageSize)      // 1-based page, returns new IsoFrame
```

### Missing Values

```ts
df.isNa()                  // boolean mask frame
df.notNa()                 // boolean mask frame
df.dropNa(['salary'])      // drop rows where salary is null
df.fillNa(0)               // fill all nulls with 0
df.fillNa({ salary: 0, name: 'Unknown' })  // fill per column
```

### Async Operations (non-blocking)

```ts
// Filter — yields control every 50 000 rows
const engineers = await df.where(row => row.dept === 'Eng');

// Hash-Join O(n+m)
const joined = await df.join(deptFrame, 'dept', 'deptName', 'left');
// type: 'left' | 'inner' | 'right' | 'outer'

// GroupBy
const grouped = await df.groupBy('dept');
const sums    = await grouped.sum('salary');
const means   = await grouped.mean('salary');
const counts  = await grouped.count();
const result  = await grouped.agg({ salary: 'sum', age: 'mean' });
```

### Reshape

```ts
// Pivot table
const pivot = await df.pivot('dept', 'year', 'revenue', 'sum');

// Melt (wide → long)
const melted = df.melt(['id', 'name'], ['q1', 'q2', 'q3', 'q4']);
```

### Series (column accessor)

```ts
const s = df.col('salary');
s.unique()        // distinct values
s.valueCounts()   // [{ value, count }] sorted by frequency
s.sum()           // numeric sum
s.mean()          // numeric mean
s.min() / s.max()
s.toArray()
```

### Export

```ts
df.toArray()    // Row[]  — shallow copy
df.toObject()   // ColumnMap  — { col: value[] }
```

### Static

```ts
IsoFrame.concat([df1, df2, df3])   // vertical concatenation
```

---

## `@nice-tools/isocsv` API

```ts
import { parseCSV, stringifyCSV } from '@nice-tools/isocsv';

const { rows, columns, errors } = parseCSV(csvString, {
  delimiter: ',',      // default ','  — use '\t' for TSV
  header: true,        // first row as column names
  inferTypes: true,    // auto-convert numbers
  skipBlank: true,
  emptyValue: null,
  comment: '#',        // skip lines starting with '#'
});

// rows is Row[] compatible with IsoFrame constructor
const df = new IsoFrame(rows);

// Serialize back
const csv = stringifyCSV(df.toArray(), df.columns);
```

---

## `@nice-tools/isoframe-react` Hooks

```ts
import {
  useFrame,
  useSorted,
  useFiltered,
  usePaginated,
  useGrouped,
} from '@nice-tools/isoframe-react';

// Load data into a frame
const { frame, loading, error, setData } = useFrame(initialRows);

// Sort (memoized)
const sorted = useSorted(frame, 'salary', 'desc');

// Async filter (non-blocking)
const { filtered, loading } = useFiltered(frame, row => row.dept === 'Eng');

// Paginate (memoized)
const { page, totalPages, totalRows } = usePaginated(frame, pageNum, 20);

// GroupBy (async)
const { grouped, loading } = useGrouped(frame, 'department');
```

---

## Demo App

The `apps/demo-react` Next.js app demonstrates all features:

- **Employees tab** — full 200-row dataset in AG Grid with column sorting/filtering
- **Joined tab** — left hash-join of Employees × Orders displayed in AG Grid  
- **Grouped tab** — GroupBy department → sum salary + mean age
- **Paginated tab** — isoframe-controlled filter + sort + pagination
- **CSV tab** — live CSV editor parsed by `@nice-tools/isocsv` → AG Grid

```bash
npm run demo   # http://localhost:3000
```

---

## License

MIT