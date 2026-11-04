/** Stored in IndexedDB, so existing values must not change. */
export enum SheetsPatchesType {
  Base = 0,
  Delta = 1,
  Drifted = 2,
}
