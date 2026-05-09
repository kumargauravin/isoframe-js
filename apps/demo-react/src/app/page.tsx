'use client';

import { useState, useEffect, useMemo } from 'react';
import { employeeFrame, orderFrame } from '../lib/fakeData';
import { IsoFrame } from '@nice-tools/isoframe';
import type { IIsoFrame, Row } from '@nice-tools/isoframe';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

type TabKey = 'employees' | 'joined' | 'grouped' | 'paginated' | 'csv';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>('employees');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortKey, setSortKey] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageNum, setPageNum] = useState(1);
  const pageSize = 20;

  const [joinedFrame, setJoinedFrame] = useState<IIsoFrame | null>(null);
  const [groupedFrame, setGroupedFrame] = useState<IIsoFrame | null>(null);
  const [filteredFrame, setFilteredFrame] = useState<IIsoFrame | null>(null);
  const [stats, setStats] = useState({ totalEmp: 0, totalOrders: 0, avgSalary: 0, depts: 0 });

  // Stats
  useEffect(() => {
    const totalEmp = employeeFrame.shape[0];
    const totalOrders = orderFrame.shape[0];
    const avgSalary = Math.round(employeeFrame.col('salary').mean());
    const depts = employeeFrame.col('department').unique().length;
    setStats({ totalEmp, totalOrders, avgSalary, depts });
  }, []);

  // Join: employees + orders on id = employeeId
  useEffect(() => {
    (async () => {
      const joined = await employeeFrame.join(orderFrame, 'id', 'employeeId', 'left');
      setJoinedFrame(joined);
    })();
  }, []);

  // GroupBy dept → sum salary
  useEffect(() => {
    (async () => {
      const grouped = await employeeFrame.groupBy('department');
      const agg = await grouped.agg({ salary: 'sum', age: 'mean' });
      setGroupedFrame(agg.sortBy('salary_sum', 'desc'));
    })();
  }, []);

  // Filter
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await employeeFrame.where((row) => {
        const deptOk = !filterDept || row.department === filterDept;
        const statusOk = !filterStatus || row.status === filterStatus;
        return deptOk && statusOk;
      });
      if (!cancelled) setFilteredFrame(result.sortBy(sortKey, sortOrder));
    })();
    return () => { cancelled = true; };
  }, [filterDept, filterStatus, sortKey, sortOrder]);

  // Paginated data
  const paginatedFrame = useMemo(() => {
    if (!filteredFrame) return null;
    return filteredFrame.paginate(pageNum, pageSize);
  }, [filteredFrame, pageNum]);

  const totalPages = useMemo(() => {
    if (!filteredFrame) return 1;
    return Math.ceil(filteredFrame.shape[0] / pageSize);
  }, [filteredFrame]);

  // Columns for AG Grid
  const empColumns: ColDef[] = [
    { field: 'id', width: 70 },
    { field: 'firstName', headerName: 'First' },
    { field: 'lastName', headerName: 'Last' },
    { field: 'department' },
    { field: 'region' },
    { field: 'salary', valueFormatter: (p) => `$${p.value?.toLocaleString()}` },
    { field: 'age', width: 80 },
    { field: 'yearsExp', headerName: 'Exp', width: 80 },
    {
      field: 'status',
      cellRenderer: (p: any) => {
        const cls = p.value === 'active' ? 'badge-green' : p.value === 'inactive' ? 'badge-red' : 'badge-yellow';
        return `<span class="badge ${cls}">${p.value}</span>`;
      },
    },
    { field: 'joinDate' },
    { field: 'score' },
  ];

  const joinedColumns: ColDef[] = [
    { field: 'id', width: 70 },
    { field: 'firstName', headerName: 'First' },
    { field: 'department' },
    { field: 'orderId', headerName: 'Order' },
    { field: 'product' },
    { field: 'quantity', width: 100 },
    { field: 'unitPrice', headerName: 'Unit $', valueFormatter: (p) => `$${p.value}` },
    { field: 'orderDate' },
    { field: 'status' },
  ];

  const groupedColumns: ColDef[] = [
    { field: 'department', flex: 1 },
    { field: 'salary_sum', headerName: 'Total Salary', valueFormatter: (p) => `$${p.value?.toLocaleString()}` },
    { field: 'age_mean', headerName: 'Avg Age', valueFormatter: (p) => p.value?.toFixed(1) },
  ];

  const depts = employeeFrame.col('department').unique() as string[];
  const statuses = employeeFrame.col('status').unique() as string[];

  return (
    <div className="container">
      <div className="card">
        <h1>@nice-tools/isoframe Dashboard Demo</h1>
        <p style={{ color: '#6b7280' }}>
          Isomorphic DataFrame · Hash-Join · GroupBy · Filter · Sort · Paginate · AG Grid
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{stats.totalEmp}</div>
          <div className="label">Employees</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.totalOrders}</div>
          <div className="label">Orders</div>
        </div>
        <div className="stat-card">
          <div className="value">${stats.avgSalary.toLocaleString()}</div>
          <div className="label">Avg Salary</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.depts}</div>
          <div className="label">Departments</div>
        </div>
        <div className="stat-card">
          <div className="value">{joinedFrame?.shape[0] ?? '…'}</div>
          <div className="label">Joined Rows</div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {(['employees', 'joined', 'grouped', 'paginated', 'csv'] as TabKey[]).map((t) => (
            <button
              key={t}
              className={`tab ${activeTab === t ? 'active' : ''}`}
              onClick={() => { setActiveTab(t); setPageNum(1); }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'employees' && (
          <>
            <h2>All Employees ({employeeFrame.shape[0]} rows)</h2>
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Sorted client-side by AG Grid. Full dataset loaded.
            </p>
            <div className="ag-theme-quartz" style={{ height: 500 }}>
              <AgGridReact
                rowData={employeeFrame.toArray() as Row[]}
                columnDefs={empColumns}
                defaultColDef={{ sortable: true, filter: true, resizable: true, flex: 1, minWidth: 80 }}
                pagination={true}
                paginationPageSize={20}
              />
            </div>
          </>
        )}

        {activeTab === 'joined' && (
          <>
            <h2>Employees ⟕ Orders (left hash-join on id = employeeId)</h2>
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Hash-join O(n+m). {joinedFrame?.shape[0] ?? '…'} joined rows.
            </p>
            {joinedFrame && (
              <div className="ag-theme-quartz" style={{ height: 500 }}>
                <AgGridReact
                  rowData={joinedFrame.toArray() as Row[]}
                  columnDefs={joinedColumns}
                  defaultColDef={{ sortable: true, filter: true, resizable: true, flex: 1, minWidth: 80 }}
                  pagination={true}
                  paginationPageSize={20}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'grouped' && (
          <>
            <h2>GroupBy Department → Sum Salary + Mean Age</h2>
            {groupedFrame && (
              <div className="ag-theme-quartz" style={{ height: 400 }}>
                <AgGridReact
                  rowData={groupedFrame.toArray() as Row[]}
                  columnDefs={groupedColumns}
                  defaultColDef={{ sortable: true, resizable: true, flex: 1 }}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'paginated' && (
          <>
            <h2>Filter + Sort + Paginate (isoframe-controlled)</h2>
            <div className="filter-bar">
              <label>Department:</label>
              <select value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setPageNum(1); }}>
                <option value="">All</option>
                {depts.sort().map((d) => <option key={d}>{d}</option>)}
              </select>
              <label>Status:</label>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPageNum(1); }}>
                <option value="">All</option>
                {statuses.map((s) => <option key={s}>{s}</option>)}
              </select>
              <label>Sort by:</label>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                {['id', 'salary', 'age', 'score', 'joinDate'].map((k) => <option key={k}>{k}</option>)}
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
              <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#6b7280' }}>
                {filteredFrame?.shape[0] ?? 0} rows found
              </span>
            </div>
            {paginatedFrame && (
              <div className="ag-theme-quartz" style={{ height: 450 }}>
                <AgGridReact
                  rowData={paginatedFrame.toArray() as Row[]}
                  columnDefs={empColumns}
                  defaultColDef={{ resizable: true, flex: 1, minWidth: 80 }}
                  suppressMovableColumns={false}
                />
              </div>
            )}
            <div className="pagination">
              <button onClick={() => setPageNum(1)} disabled={pageNum === 1}>«</button>
              <button onClick={() => setPageNum((p) => Math.max(1, p - 1))} disabled={pageNum === 1}>‹</button>
              <span>Page {pageNum} of {totalPages}</span>
              <button onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))} disabled={pageNum === totalPages}>›</button>
              <button onClick={() => setPageNum(totalPages)} disabled={pageNum === totalPages}>»</button>
            </div>
          </>
        )}

        {activeTab === 'csv' && (
          <CSVTab />
        )}
      </div>
    </div>
  );
}

function CSVTab() {
  const [csvText, setCsvText] = useState(`id,name,dept,salary,joinDate
1,Alice Smith,Engineering,95000,2021-03-15
2,Bob Jones,HR,62000,2019-07-22
3,Carol White,Engineering,112000,2018-01-10
4,Dave Brown,Sales,78000,2022-11-01
5,Eve Davis,Marketing,84000,2020-05-30`);
  const [frame, setFrame] = useState<IIsoFrame | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { parseCSV } = await import('@nice-tools/isocsv');
        const { rows } = parseCSV(csvText);
        setFrame(new IsoFrame(rows));
        setError('');
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [csvText]);

  const cols: ColDef[] = frame
    ? frame.columns.map((c) => ({ field: c, flex: 1 }))
    : [];

  return (
    <>
      <h2>CSV → IsoFrame (@nice-tools/isocsv)</h2>
      <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Edit the CSV below and see it parsed live.</p>
      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        style={{ width: '100%', height: 160, fontFamily: 'monospace', fontSize: 13, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {frame && (
        <>
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            Shape: {frame.shape[0]} rows × {frame.shape[1]} cols
          </p>
          <div className="ag-theme-quartz" style={{ height: 250 }}>
            <AgGridReact
              rowData={frame.toArray() as Row[]}
              columnDefs={cols}
              defaultColDef={{ sortable: true, filter: true, resizable: true }}
            />
          </div>
        </>
      )}
    </>
  );
}
