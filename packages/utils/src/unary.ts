/**
 * Wrap a function to ensure only one argument will pass through
 */
export default function unary<A, B>(fn: (...args: any) => B) {
    return (arg: A) => fn(arg);
}
