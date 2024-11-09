/** List of native JavaScript error types to distinguish from
 * WASM-generated errors. Used to identify errors originating
 * from the JavaScript runtime vs errors coming from WASM. */
const NATIVE_JS_ERROR_TYPES = [
    typeof TypeError !== 'undefined' ? TypeError : null,
    typeof ReferenceError !== 'undefined' ? ReferenceError : null,
    typeof SyntaxError !== 'undefined' ? SyntaxError : null,
    typeof RangeError !== 'undefined' ? RangeError : null,
    typeof URIError !== 'undefined' ? URIError : null,
    typeof EvalError !== 'undefined' ? EvalError : null,
].filter((errorType): errorType is ErrorConstructor => errorType !== null);

export const isNativeJSError = (error: unknown): boolean =>
    NATIVE_JS_ERROR_TYPES.some((errorType) => error instanceof errorType);
