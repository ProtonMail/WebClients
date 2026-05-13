/**
 * Chromium net error codes and their string equivalents.
 * @see https://source.chromium.org/chromium/chromium/src/+/main:net/base/net_error_list.h
 */

// All codes we currently use. Extend as needed.
export const NET_ERROR_CODE = {
    ABORTED: -3,
    TIMED_OUT: -7,
    NETWORK_CHANGED: -21,
    CONNECTION_CLOSED: -100,
    CONNECTION_RESET: -101,
    CONNECTION_REFUSED: -102,
    NAME_NOT_RESOLVED: -105,
    INTERNET_DISCONNECTED: -106,
    ADDRESS_UNREACHABLE: -109,
    CONNECTION_TIMED_OUT: -118,
    PROXY_CONNECTION_FAILED: -130,
    NAME_RESOLUTION_FAILED: -137,
    INVALID_URL: -300,
    NETWORK_IO_SUSPENDED: -331,
} as const;

/**
 * User-side network errors that are never actionable on our side.
 *
 * Each entry maps a Chromium / Node network error code string (`net:ERR_*` and `ENOTFOUND`)
 */
const USER_NETWORK_ERRORS: ReadonlyMap<number, readonly string[]> = new Map([
    [NET_ERROR_CODE.ABORTED, ["ERR_ABORTED"]],
    [NET_ERROR_CODE.TIMED_OUT, ["ERR_TIMED_OUT", "ETIMEDOUT"]],
    [NET_ERROR_CODE.NETWORK_CHANGED, ["ERR_NETWORK_CHANGED"]],
    [NET_ERROR_CODE.CONNECTION_CLOSED, ["ERR_CONNECTION_CLOSED"]],
    [NET_ERROR_CODE.CONNECTION_RESET, ["ERR_CONNECTION_RESET", "ECONNRESET"]],
    [NET_ERROR_CODE.CONNECTION_REFUSED, ["ERR_CONNECTION_REFUSED"]],
    [NET_ERROR_CODE.NAME_NOT_RESOLVED, ["ERR_NAME_NOT_RESOLVED", "ENOTFOUND"]],
    [NET_ERROR_CODE.INTERNET_DISCONNECTED, ["ERR_INTERNET_DISCONNECTED"]],
    [NET_ERROR_CODE.ADDRESS_UNREACHABLE, ["ERR_ADDRESS_UNREACHABLE"]],
    [NET_ERROR_CODE.CONNECTION_TIMED_OUT, ["ERR_CONNECTION_TIMED_OUT"]],
    [NET_ERROR_CODE.PROXY_CONNECTION_FAILED, ["ERR_PROXY_CONNECTION_FAILED"]],
    [NET_ERROR_CODE.NAME_RESOLUTION_FAILED, ["ERR_NAME_RESOLUTION_FAILED"]],
    [NET_ERROR_CODE.NETWORK_IO_SUSPENDED, ["ERR_NETWORK_IO_SUSPENDED"]],
]);

// Patterns that don't have a specific Chromium code but may still indicate network issues.
// ECONNABORTED: POSIX abort;
// ERR_FAILED: broad Chromium catch-all;
// treated as user-side since it is not actionable from our side.
const EXTRA_NETWORK_PATTERNS = ["ECONNABORTED", "ERR_FAILED"];

const networkErrorCodes = new Set(USER_NETWORK_ERRORS.keys());
const networkErrorPatterns = [...Array.from(USER_NETWORK_ERRORS.values()).flat(), ...EXTRA_NETWORK_PATTERNS];

// Pre-compile a single regex expression with word boundaries so patterns only match whole tokens.
// e.g. "ERR_TIMED_OUT" must not match inside "ERR_TIMED_OUT_EXTENDED".
const networkErrorRegex = new RegExp(`\\b(${networkErrorPatterns.join("|")})\\b`);

/** Returns true if the Chromium net error code is a user-side network issue. */
export function isUserNetworkErrorCode(errorCode: number): boolean {
    return networkErrorCodes.has(errorCode);
}

/** Returns true if the Error's message matches a known network error pattern. */
export function isNetworkError(error: Error): boolean {
    return networkErrorRegex.test(error.message);
}
