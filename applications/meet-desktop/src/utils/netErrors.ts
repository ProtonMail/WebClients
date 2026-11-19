/**
 * @see https://www.electronjs.org/docs/latest/api/web-contents#event-did-fail-load
 * @see https://source.chromium.org/chromium/chromium/src/+/main:net/base/net_error_list.h
 */
const NET_ERROR_CODE = {
    ABORTED: -3,
    CONNECTION_REFUSED: -102,
    ERR_NAME_NOT_RESOLVED: -105,
    INVALID_URL: -300,
};

export const IGNORED_NET_ERROR_CODES = [NET_ERROR_CODE.ABORTED];
