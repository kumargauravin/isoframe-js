# isoframe-js

> A zero-dependency, isomorphic (Node + Browser) DataFrame ecosystem for dashboarding, complex JSON joins, and CSV parsing — built in TypeScript and designed for React 19 / Next.js apps.

---

## Packages

| Package | Version | Description |
|---|---|---|
| [`@nice-tools/isoframe`](packages/isoframe) | 0.1.0 | Core DataFrame — zero deps, isomorphic |
| [`@nice-tools/isocsv`](packages/isocsv) | 0.1.0 | RFC 4180 CSV/TSV parser — zero deps, isomorphic |
| [`@nice-tools/isojson`](packages/isojson) | 0.1.0 | CosmosDB doc flattener + schema coercer — zero deps |
| [`@nice-tools/isoframe-react`](packages/isoframe-react) | 0.1.0 | React 19 hooks for IsoFrame |
| [`demo-react`](apps/demo-react) | — | Next.js 16 demo app with AG Grid |

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
│   ├── isojson/              ← @nice-tools/isojson
│   │   └── src/
│   │       ├── flatten.ts    ← JSON flattening + record key alignment
│   │       ├── coerce.ts     ← schema-driven + auto type coercion
│   │       ├── cosmosdb.ts   ← CosmosDB system-field stripping + flatten
│   │       └── types.ts
│   └── isoframe-react/       ← @nice-tools/isoframe-react
│       └── src/hooks/        ← useFrame, useSorted, useFiltered, usePaginated, useGrouped
└── apps/
    └── demo-react/           ← Next.js 16 demo (AG Grid dashboard)
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

## CI/CD Workflows

- `ci.yml`: runs lint, build, and tests on pushes/PRs to `main` (Node.js 22, `npm ci`).
- `create-release-tag.yml`: bumps versions across all publishable packages (`isoframe`, `isocsv`, `isojson`, `isoframe-react`) and creates a release tag.
- `publish-npm.yml`: publishes via the local custom action at `.github/actions/publish-modules`, with workflow dispatch and tag-based publish support.
- `trigger-deploy.yml`: triggers `deploy-pages.yml` after successful npm publish completion (or manually via dispatch).
- `deploy-pages.yml`: builds and deploys `apps/demo-react` static output to GitHub Pages.

### Notes on sync with `fake-llm`

- `isoframe-js` intentionally uses Node.js 22 + `npm ci`; `fake-llm` remains on Node.js 20 + `npm install --legacy-peer-deps`.
- `isoframe-js` release tagging is multi-package; `fake-llm` uses a single-package version bump flow.

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
df.copy()           // deep copy
```

### Selection & Wrangling

```ts
df.select(['id', 'name'])              // keep only these columns
df.drop(['salary'])                    // drop these columns
df.rename({ name: 'fullName' })        // rename columns
df.assign('bonus', row => row.salary * 0.1)  // add/overwrite column
df.apply(row => ({ ...row, fullName: `${row.first} ${row.last}` }))
```

### Sorting & Pagination

```ts
df.sort_values('salary', false)        // sync, returns new IsoFrame (false = descending)
df.paginate(pageNumber, pageSize)      // 1-based page, returns new IsoFrame
```

### Missing Values

```ts
df.isna()                  // boolean mask frame
df.notna()                 // boolean mask frame
df.dropna(['salary'])      // drop rows where salary is null
df.fillna(0)               // fill all nulls with 0
df.fillna({ salary: 0, name: 'Unknown' })  // fill per column
```

### Async Operations (non-blocking)

```ts
// Filter — chunked processing (chunk size 5 000); yields to event loop for datasets > 50 000 rows
const engineers = await df.query(row => row.dept === 'Eng');

// Hash-Join O(n+m)
const joined = await df.merge(deptFrame, 'dept', 'deptName', 'left');
// how: 'left' | 'inner' | 'right' | 'outer'

// GroupBy
const grouped = await df.groupby('dept');
const sums    = await grouped.sum('salary');
const means   = await grouped.mean('salary');
const counts  = await grouped.count();
const result  = await grouped.agg({ salary: 'sum', age: 'mean' });
```

### Reshape

```ts
// Pivot table
const pivot = await df.pivot_table('dept', 'year', 'revenue', 'sum');

// Melt (wide → long)
const melted = df.melt(['id', 'name'], ['q1', 'q2', 'q3', 'q4']);
```

### Series (column accessor)

```ts
const s = df.col('salary');
s.unique()        // distinct values
s.value_counts()  // [{ value, count }] sorted by frequency
s.sum()           // numeric sum
s.mean()          // numeric mean
s.min() / s.max()
s.to_list()
```

### Export

```ts
df.to_list()    // Row[]  — shallow copy
df.to_dict()    // ColumnMap  — { col: value[] }
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
const csv = stringifyCSV(df.to_list(), df.columns);
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
const sorted = useSorted(frame, 'salary', false);

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
