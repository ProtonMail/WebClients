declare module 'csstype' {
  // @ts-ignore
  interface Properties<T> {
    // @ts-ignore allow css variables
    [index: string]: unknown
  }
}

export * from './lib'
export * from './constants'
