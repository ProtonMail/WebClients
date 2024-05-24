type ExcludeFunctions<T> = T extends (...args: any[]) => any ? never : T
export type ParamsExcludingFunctions<T> = {
  [K in keyof T]: ExcludeFunctions<T[K]>
}
