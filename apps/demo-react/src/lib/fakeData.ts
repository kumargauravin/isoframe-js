import { IsoFrame } from '@nice-tools/isoframe';

const DEPTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Product', 'Legal'];
const REGIONS = ['North America', 'Europe', 'APAC', 'LATAM'];
const STATUS = ['active', 'inactive', 'pending'] as const;
const FIRST_NAMES = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];
const LAST_NAMES = ['Smith', 'Jones', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson'];

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rndInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rndDate(start: Date, end: Date): string {
  const t = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(t).toISOString().slice(0, 10);
}

export function generateEmployees(n = 200) {
  const rows = [];
  for (let i = 1; i <= n; i++) {
    const dept = rnd(DEPTS);
    rows.push({
      id: i,
      firstName: rnd(FIRST_NAMES),
      lastName: rnd(LAST_NAMES),
      department: dept,
      region: rnd(REGIONS),
      salary: rndInt(40000, 180000),
      age: rndInt(22, 65),
      yearsExp: rndInt(0, 30),
      status: rnd(STATUS),
      joinDate: rndDate(new Date('2015-01-01'), new Date('2024-12-31')),
      score: Math.round(Math.random() * 100 * 10) / 10,
    });
  }
  return rows;
}

export function generateOrders(n = 300) {
  const rows = [];
  const products = ['Widget A', 'Widget B', 'Gadget X', 'Gadget Y', 'Service Pro', 'Service Lite'];
  for (let i = 1; i <= n; i++) {
    rows.push({
      orderId: i,
      employeeId: rndInt(1, 200),
      product: rnd(products),
      quantity: rndInt(1, 50),
      unitPrice: rndInt(10, 500),
      orderDate: rndDate(new Date('2023-01-01'), new Date('2024-12-31')),
      region: rnd(REGIONS),
      status: rnd(['shipped', 'pending', 'cancelled', 'returned']),
    });
  }
  return rows;
}

export const employeeFrame = new IsoFrame(generateEmployees(200));
export const orderFrame = new IsoFrame(generateOrders(300));
