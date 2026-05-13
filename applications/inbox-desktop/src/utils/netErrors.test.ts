import { isUserNetworkErrorCode, isNetworkError } from "./netErrors";

describe("isUserNetworkErrorCode", () => {
    it.each([
        [-3, "ERR_ABORTED"],
        [-7, "ERR_TIMED_OUT"],
        [-21, "ERR_NETWORK_CHANGED"],
        [-100, "ERR_CONNECTION_CLOSED"],
        [-101, "ERR_CONNECTION_RESET"],
        [-102, "ERR_CONNECTION_REFUSED"],
        [-105, "ERR_NAME_NOT_RESOLVED"],
        [-106, "ERR_INTERNET_DISCONNECTED"],
        [-109, "ERR_ADDRESS_UNREACHABLE"],
        [-118, "ERR_CONNECTION_TIMED_OUT"],
        [-130, "ERR_PROXY_CONNECTION_FAILED"],
        [-137, "ERR_NAME_RESOLUTION_FAILED"],
        [-331, "ERR_NETWORK_IO_SUSPENDED"],
    ])("returns true for %i (%s)", (code) => {
        expect(isUserNetworkErrorCode(code)).toBe(true);
    });

    it.each([
        [-300, "ERR_INVALID_URL"],
        [-200, "ERR_CERT_DATE_INVALID"],
        [0, "no error"],
    ])("returns false for %i (%s)", (code) => {
        expect(isUserNetworkErrorCode(code)).toBe(false);
    });
});

describe("isNetworkError", () => {
    it.each([
        "net::ERR_ABORTED",
        "net::ERR_FAILED",
        "net::ERR_TIMED_OUT",
        "net::ERR_NETWORK_CHANGED",
        "net::ERR_NAME_NOT_RESOLVED",
        "net::ERR_CONNECTION_REFUSED",
        "net::ERR_NETWORK_IO_SUSPENDED",
        "getaddrinfo ENOTFOUND proton.me",
        "connect ETIMEDOUT 1.2.3.4:443",
        "read ECONNRESET",
        "socket hang up ECONNABORTED",
    ])("returns true for '%s'", (message) => {
        expect(isNetworkError(new Error(message))).toBe(true);
    });

    it.each([
        "Unexpected token < in JSON at position 0",
        "Cannot read properties of undefined",
        "certificate has expired",
        "some random error",
    ])("returns false for '%s'", (message) => {
        expect(isNetworkError(new Error(message))).toBe(false);
    });

    it("returns false when pattern appears only as a prefix of a longer error code", () => {
        expect(isNetworkError(new Error("net::ERR_TIMED_OUT_EXTENDED"))).toBe(false);
    });
});
