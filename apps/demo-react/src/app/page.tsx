'use client';

import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';

import { employeeFrame, orderFrame } from '../lib/fakeData';
import { IsoFrame } from '@nice-tools/isoframe';
import type { IIsoFrame, Row } from '@nice-tools/isoframe';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

const gridTheme = themeQuartz.withParams({
  borderRadius: 8,
  headerBackgroundColor: '#f1f5f9',
  headerTextColor: '#374151',
  rowHoverColor: '#eff6ff',
  fontSize: 13,
});

type TabKey = 'employees' | 'joined' | 'grouped' | 'paginated' | 'isojson';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>('employees');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortCol, setSortCol] = useState('id');
  const [ascending, setAscending] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const pageSize = 20;

  const [joinedFrame, setJoinedFrame] = useState<IIsoFrame | null>(null);
  const [groupedFrame, setGroupedFrame] = useState<IIsoFrame | null>(null);
  const [filteredFrame, setFilteredFrame] = useState<IIsoFrame | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalEmp: 0, totalOrders: 0, avgSalary: 0, depts: 0 });

  useEffect(() => {
    setStats({
      totalEmp: employeeFrame.shape[0],
      totalOrders: orderFrame.shape[0],
      avgSalary: Math.round(employeeFrame.col('salary').mean()),
      depts: employeeFrame.col('department').unique().length,
    });
  }, []);

  useEffect(() => {
    (async () => {
      const joined = await employeeFrame.merge(orderFrame, 'id', 'employeeId', 'left');
      setJoinedFrame(joined);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const grouped = await employeeFrame.groupby('department');
      const agg = await grouped.agg({ salary: 'sum', age: 'mean' });
      setGroupedFrame(agg.sort_values('salary_sum', false));
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const result = await employeeFrame.query((row) => {
        const deptOk = !filterDept || row.department === filterDept;
        const statusOk = !filterStatus || row.status === filterStatus;
        return deptOk && statusOk;
      });
      if (!cancelled) {
        setFilteredFrame(result.sort_values(sortCol, ascending));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filterDept, filterStatus, sortCol, ascending]);

  const paginatedFrame = useMemo(() => {
    if (!filteredFrame) return null;
    return filteredFrame.paginate(pageNum, pageSize);
  }, [filteredFrame, pageNum]);

  const totalPages = useMemo(() => {
    if (!filteredFrame) return 1;
    return Math.ceil(filteredFrame.shape[0] / pageSize);
  }, [filteredFrame]);

  const empColumns: ColDef[] = [
    { field: 'id', width: 70 },
    { field: 'firstName', headerName: 'First', minWidth: 90 },
    { field: 'lastName', headerName: 'Last', minWidth: 90 },
    { field: 'department', minWidth: 110 },
    { field: 'region', minWidth: 130 },
    { field: 'salary', valueFormatter: (p) => `$${p.value?.toLocaleString()}`, minWidth: 110 },
    { field: 'age', width: 80 },
    { field: 'yearsExp', headerName: 'Exp', width: 80 },
    {
      field: 'status',
      minWidth: 100,
      cellRenderer: (p: any) =>
        `<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:${p.value === 'active' ? '#d1fae5' : p.value === 'inactive' ? '#fee2e2' : '#fef3c7'};color:${p.value === 'active' ? '#065f46' : p.value === 'inactive' ? '#991b1b' : '#92400e'}">${p.value}</span>`,
    },
    { field: 'joinDate', minWidth: 110 },
    { field: 'score', width: 90 },
  ];

  const joinedColumns: ColDef[] = [
    { field: 'id', width: 70 },
    { field: 'firstName', headerName: 'First', minWidth: 90 },
    { field: 'department', minWidth: 110 },
    { field: 'orderId', headerName: 'Order #', width: 90 },
    { field: 'product', minWidth: 110 },
    { field: 'quantity', width: 100 },
    { field: 'unitPrice', headerName: 'Unit $', valueFormatter: (p) => `$${p.value}`, width: 100 },
    { field: 'orderDate', minWidth: 110 },
    { field: 'status', minWidth: 100 },
  ];

  const groupedColumns: ColDef[] = [
    { field: 'department', flex: 1, minWidth: 130 },
    { field: 'salary_sum', headerName: 'Total Salary', flex: 1, valueFormatter: (p) => `$${p.value?.toLocaleString()}` },
    { field: 'age_mean', headerName: 'Avg Age', width: 110, valueFormatter: (p) => p.value?.toFixed(1) },
  ];

  const depts = (employeeFrame.col('department').unique() as string[]).sort();
  const statuses = employeeFrame.col('status').unique() as string[];

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'employees', label: 'All Employees' },
    { key: 'joined', label: 'Hash-Join' },
    { key: 'grouped', label: 'GroupBy' },
    { key: 'paginated', label: 'Filter + Paginate' },
    { key: 'isojson', label: 'IsoJSON / CSV' },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          @nice-tools/isoframe
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Isomorphic DataFrame · Hash-Join · GroupBy · query() · sort_values() · paginate() ·
          MUI 9 · AG Grid 35 · Next 16
        </Typography>
      </Paper>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Employees', value: stats.totalEmp },
          { label: 'Orders', value: stats.totalOrders },
          { label: 'Avg Salary', value: `$${stats.avgSalary.toLocaleString()}` },
          { label: 'Departments', value: stats.depts },
          { label: 'Joined Rows', value: joinedFrame?.shape[0] ?? '…' },
        ].map(({ label, value }) => (
          <Grid key={label} size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" color="primary" fontWeight={700}>
                {value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: 1 }}>
          {tabs.map(({ key, label }) => (
            <Button
              key={key}
              variant={activeTab === key ? 'contained' : 'outlined'}
              size="small"
              onClick={() => { setActiveTab(key); setPageNum(1); }}
            >
              {label}
            </Button>
          ))}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* ── All Employees ─────────────────────────────────────────────── */}
        {activeTab === 'employees' && (
          <>
            <Typography variant="h6" gutterBottom>
              All Employees <Chip label={`${employeeFrame.shape[0]} rows`} size="small" color="primary" sx={{ ml: 1 }} />
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Sorted client-side by AG Grid. Full dataset loaded via <code>to_list()</code>.
            </Typography>
            <div style={{ height: 500 }}>
              <AgGridReact
                theme={gridTheme}
                rowData={employeeFrame.to_list() as Row[]}
                columnDefs={empColumns}
                defaultColDef={{ sortable: true, filter: true, resizable: true, flex: 1 }}
                pagination
                paginationPageSize={20}
              />
            </div>
          </>
        )}

        {/* ── Hash-Join ─────────────────────────────────────────────────── */}
        {activeTab === 'joined' && (
          <>
            <Typography variant="h6" gutterBottom>
              Employees ⟕ Orders
              <Chip label="merge(left_on='id', right_on='employeeId')" size="small" sx={{ ml: 1 }} />
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Hash-join O(n+m) — not O(n×m). Builds a hash-map of Orders first, then probes with Employees.
              {joinedFrame && ` Result: ${joinedFrame.shape[0]} rows.`}
            </Alert>
            {joinedFrame ? (
              <div style={{ height: 500 }}>
                <AgGridReact
                  theme={gridTheme}
                  rowData={joinedFrame.to_list() as Row[]}
                  columnDefs={joinedColumns}
                  defaultColDef={{ sortable: true, filter: true, resizable: true, flex: 1 }}
                  pagination
                  paginationPageSize={20}
                />
              </div>
            ) : <CircularProgress />}
          </>
        )}

        {/* ── GroupBy ───────────────────────────────────────────────────── */}
        {activeTab === 'grouped' && (
          <>
            <Typography variant="h6" gutterBottom>
              groupby('department') → agg(salary: 'sum', age: 'mean')
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Multi-level async groupBy with chained aggregation. Sorted by total salary descending via <code>sort_values('salary_sum', false)</code>.
            </Alert>
            {groupedFrame ? (
              <div style={{ height: 400 }}>
                <AgGridReact
                  theme={gridTheme}
                  rowData={groupedFrame.to_list() as Row[]}
                  columnDefs={groupedColumns}
                  defaultColDef={{ sortable: true, resizable: true, flex: 1 }}
                />
              </div>
            ) : <CircularProgress />}
          </>
        )}

        {/* ── Filter + Paginate ─────────────────────────────────────────── */}
        {activeTab === 'paginated' && (
          <>
            <Typography variant="h6" gutterBottom>
              query() + sort_values() + paginate()
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 2, gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={filterDept}
                  label="Department"
                  onChange={(e) => { setFilterDept(e.target.value); setPageNum(1); }}
                >
                  <MenuItem value="">All</MenuItem>
                  {depts.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => { setFilterStatus(e.target.value); setPageNum(1); }}
                >
                  <MenuItem value="">All</MenuItem>
                  {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Sort by</InputLabel>
                <Select value={sortCol} label="Sort by" onChange={(e) => setSortCol(e.target.value)}>
                  {['id', 'salary', 'age', 'score', 'joinDate'].map((k) => (
                    <MenuItem key={k} value={k}>{k}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <ButtonGroup size="small">
                <Button variant={ascending ? 'contained' : 'outlined'} onClick={() => setAscending(true)}>Asc</Button>
                <Button variant={!ascending ? 'contained' : 'outlined'} onClick={() => setAscending(false)}>Desc</Button>
              </ButtonGroup>

              {loading && <CircularProgress size={20} />}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                {filteredFrame?.shape[0] ?? 0} rows matched
              </Typography>
            </Stack>

            {paginatedFrame && (
              <div style={{ height: 450 }}>
                <AgGridReact
                  theme={gridTheme}
                  rowData={paginatedFrame.to_list() as Row[]}
                  columnDefs={empColumns}
                  defaultColDef={{ resizable: true, flex: 1 }}
                />
              </div>
            )}

            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{ mt: 2 }}>
              <Button size="small" variant="outlined" onClick={() => setPageNum(1)} disabled={pageNum === 1}>«</Button>
              <Button size="small" variant="outlined" onClick={() => setPageNum((p) => p - 1)} disabled={pageNum === 1}>‹</Button>
              <Typography variant="body2">Page {pageNum} of {totalPages}</Typography>
              <Button size="small" variant="outlined" onClick={() => setPageNum((p) => p + 1)} disabled={pageNum >= totalPages}>›</Button>
              <Button size="small" variant="outlined" onClick={() => setPageNum(totalPages)} disabled={pageNum >= totalPages}>»</Button>
            </Stack>
          </>
        )}

        {/* ── IsoJSON / CSV ─────────────────────────────────────────────── */}
        {activeTab === 'isojson' && <IsoJsonTab />}
      </Paper>
    </Container>
  );
}

function IsoJsonTab() {
  const [csvText, setCsvText] = useState(
    `id,name,dept,salary,joinDate\n1,Alice Smith,Engineering,95000,2021-03-15\n2,Bob Jones,HR,62000,2019-07-22\n3,Carol White,Engineering,112000,2018-01-10\n4,Dave Brown,Sales,78000,2022-11-01\n5,Eve Davis,Marketing,84000,2020-05-30`,
  );
  const [csvFrame, setCsvFrame] = useState<IIsoFrame | null>(null);
  const [csvError, setCsvError] = useState('');

  const [cosmosJson, setCosmosJson] = useState(
    JSON.stringify([
      { id: 'u1', name: 'Alice', address: { city: 'NYC', zip: '10001' }, tags: ['vip', 'gold'], _rid: 'r1', _ts: 1700000000 },
      { id: 'u2', name: 'Bob', address: { city: 'LA' }, age: 32, _rid: 'r2', _ts: 1700000001 },
    ], null, 2),
  );
  const [cosmosFrame, setCosmosFrame] = useState<IIsoFrame | null>(null);
  const [cosmosError, setCosmosError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { parseCSV } = await import('@nice-tools/isocsv');
        const { rows } = parseCSV(csvText);
        setCsvFrame(new IsoFrame(rows));
        setCsvError('');
      } catch (e) { setCsvError(String(e)); }
    })();
  }, [csvText]);

  useEffect(() => {
    (async () => {
      try {
        const { from_cosmosdb_records } = await import('@nice-tools/isojson');
        const docs = JSON.parse(cosmosJson);
        const rows = from_cosmosdb_records(docs);
        setCosmosFrame(new IsoFrame(rows));
        setCosmosError('');
      } catch (e) { setCosmosError(String(e)); }
    })();
  }, [cosmosJson]);

  const csvCols: ColDef[] = csvFrame?.columns.map((c) => ({ field: c, flex: 1 })) ?? [];
  const cosmosCols: ColDef[] = cosmosFrame?.columns.map((c) => ({ field: c, flex: 1, minWidth: 120 })) ?? [];

  const localTheme = themeQuartz.withParams({ fontSize: 13 });

  return (
    <Stack spacing={3}>
      {/* CSV */}
      <Box>
        <Typography variant="h6" gutterBottom>
          CSV → IsoFrame <Chip label="@nice-tools/isocsv" size="small" color="secondary" />
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Edit the CSV below — parsed live, zero dependencies.
        </Typography>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          style={{ width: '100%', height: 130, fontFamily: 'monospace', fontSize: 12, padding: '8px', border: '1px solid #e2e8f0', borderRadius: 8, boxSizing: 'border-box' }}
        />
        {csvError && <Alert severity="error" sx={{ mt: 1 }}>{csvError}</Alert>}
        {csvFrame && (
          <>
            <Typography variant="caption" color="text.secondary">
              Shape: {csvFrame.shape[0]} × {csvFrame.shape[1]}
            </Typography>
            <div style={{ height: 240, marginTop: 8 }}>
              <AgGridReact theme={localTheme} rowData={csvFrame.to_list() as Row[]} columnDefs={csvCols} defaultColDef={{ sortable: true, filter: true, resizable: true }} />
            </div>
          </>
        )}
      </Box>

      <Divider />

      {/* CosmosDB JSON */}
      <Box>
        <Typography variant="h6" gutterBottom>
          CosmosDB JSON → IsoFrame <Chip label="@nice-tools/isojson" size="small" color="secondary" />
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Paste CosmosDB documents. System fields (_rid, _ts, etc.) are stripped. Nested objects are flattened with dot-notation.
        </Typography>
        <textarea
          value={cosmosJson}
          onChange={(e) => setCosmosJson(e.target.value)}
          style={{ width: '100%', height: 180, fontFamily: 'monospace', fontSize: 12, padding: '8px', border: '1px solid #e2e8f0', borderRadius: 8, boxSizing: 'border-box' }}
        />
        {cosmosError && <Alert severity="error" sx={{ mt: 1 }}>{cosmosError}</Alert>}
        {cosmosFrame && (
          <>
            <Typography variant="caption" color="text.secondary">
              Shape: {cosmosFrame.shape[0]} × {cosmosFrame.shape[1]} — columns: {cosmosFrame.columns.join(', ')}
            </Typography>
            <div style={{ height: 200, marginTop: 8 }}>
              <AgGridReact theme={localTheme} rowData={cosmosFrame.to_list() as Row[]} columnDefs={cosmosCols} defaultColDef={{ sortable: true, resizable: true }} />
            </div>
          </>
        )}
      </Box>
    </Stack>
  );
}
