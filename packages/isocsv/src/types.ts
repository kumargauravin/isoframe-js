/** Scalar cell value — compatible with @nice-tools/isoframe Scalar */
export type CsvScalar = string | number | boolean | null;

/** A parsed row — compatible with @nice-tools/isoframe Row */
export type CsvRow = Record<string, CsvScalar>;

export interface ParseOptions {
  /** Column delimiter (default: ',') */
  delimiter?: string;
  /** Whether first row is header (default: true) */
  header?: boolean;
  /** Custom column names (used when header: false) */
  columns?: string[];
  /** Skip blank lines (default: true) */
  skipBlank?: boolean;
  /** Value to use for empty cells (default: null) */
  emptyValue?: string | null;
  /** Whether to infer numeric types (default: true) */
  inferTypes?: boolean;
  /** Comment character — skip lines starting with this */
  comment?: string;
}

export interface ParseResult {
  rows: CsvRow[];
  columns: string[];
  errors: string[];
}
