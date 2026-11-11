// Copy of packages/utils/src/clsx.ts

type ClsxObject = Record<string, any>
type ClsxValue = string | boolean | null | undefined | ClsxObject
type ClsxArguments = ClsxValue | ClsxValue[]

const isClsxObject = (value: ClsxValue): value is ClsxObject => typeof value === 'object' && value !== null

export function clsx(args: ClsxArguments[]): string
export function clsx(...args: ClsxArguments[]): string
export function clsx(...args: any): any {
  return args
    .flat()
    .flatMap((o: any) =>
      isClsxObject(o)
        ? Object.entries(o)
            .filter(([, bool]) => Boolean(bool))
            .map(([className]) => className)
        : o,
    )
    .filter((a: any) => typeof a === 'string')
    .map((a: string) => a.trim())
    .filter((a: string) => a !== '')
    .join(' ')
}
