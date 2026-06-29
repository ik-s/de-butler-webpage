declare module 'better-sqlite3' {
  export type RunResult = {
    changes: number;
    lastInsertRowid: number | bigint;
  };

  export type Statement<Params extends unknown[] = unknown[]> = {
    all(...params: Params): unknown[];
    get(...params: Params): unknown;
    run(...params: Params): RunResult;
  };

  export type Database = {
    exec(source: string): void;
    prepare<Params extends unknown[] = unknown[]>(source: string): Statement<Params>;
    close(): void;
    pragma(source: string): unknown;
  };

  export type Options = {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: (message?: unknown, ...additionalArgs: unknown[]) => void;
  };

  export default class BetterSqlite3 {
    constructor(filename: string, options?: Options);
    exec(source: string): void;
    prepare<Params extends unknown[] = unknown[]>(source: string): Statement<Params>;
    close(): void;
    pragma(source: string): unknown;
  }
}
