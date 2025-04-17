type ClsxObject = Record</** classname */ string, /** toggle */ any>;
type ClsxValue = string | boolean | null | undefined | ClsxObject;
type ClsxArguments = ClsxValue | ClsxValue[];

const isClsxObject = (value: ClsxValue): value is ClsxObject => typeof value === 'object' && value !== null;

/**
 * A tiny utility for constructing className strings conditionally. Inspired by https://www.npmjs.com/package/clsx.
 *
 * @param args A string, an array of conditional strings; or an object with class names as keys and booleans as values.
 * @returns A string of joined class names.
 *
 * @example
 * clsx({ a: true, b: true }) // => 'a b'
 * clsx(['a', 'b']) // => 'a b'
 * clsx('a', 'b') // => 'a b'
 *
 * clsx(null, '', false, undefined, ' ', true, [], {}); // => ''
 *
 * @example
 * clsx('foo bar', false && 'boo', { baz: true, qux: false }) // => 'foo bar baz'
 * clsx(['foo', false && 'bar'], false && ['qux'])) // => 'foo'
 *
 */
function clsx(args: ClsxArguments[]): string;
function clsx(...args: ClsxArguments[]): string;
function clsx(...args: any): any {
    return args
        .flat()
        .flatMap((o: any) =>
            isClsxObject(o)
                ? Object.entries(o)
                      .filter(([, bool]) => Boolean(bool))
                      .map(([className]) => className)
                : o
        )
        .filter((a: any) => typeof a === 'string')
        .map((a: string) => a.trim())
        .filter((a: string) => a !== '')
        .join(' ');
}

export default clsx;
