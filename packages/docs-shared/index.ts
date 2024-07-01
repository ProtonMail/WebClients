declare module 'csstype' {
  // @ts-ignore
  interface Properties<T> {
    // allow css variables
    [index: string]: unknown
  }
}

export * from './lib'
export * from './components'
export * from './constants'
