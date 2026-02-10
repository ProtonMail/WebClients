import { sanitizeStackTrace } from "./captureUncaughtErrors";

describe("sanitizeStackTrace", () => {
    it("should sanitize URLs with query parameters and hash in stack trace", () => {
        const stack = `TypeError: Cannot read property 'data' of undefined
    at handleResponse (https://meet.proton.me/assets/app-bundle.js?v=1.2.3&token=abc123#fragment:125:45)
    at fetch.then (https://meet.proton.me/api/endpoint?sessionId=xyz789&user=john.doe@example.com:89:12)
    at processData (webpack-internal:///./src/utils/data.ts:45:10)`;

        const expected = `TypeError: Cannot read property 'data' of undefined
    at handleResponse (https://meet.proton.me/assets/app-bundle.js)
    at fetch.then (https://meet.proton.me/api/endpoint)
    at processData (webpack-internal:///./src/utils/data.ts:45:10)`;

        expect(sanitizeStackTrace(stack)).toBe(expected);
    });

    it("should handle multiple URLs in a single line and preserve non-http protocols", () => {
        const stack = `Error: Network request failed
    at XMLHttpRequest.onError (https://cdn.example.com/lib.js?key=secret123:10:5) -> https://api.example.com/v1/users?id=12345&token=abcdef
    at async loadData (file:///Users/user/app/main.js:55:8)
    at main (https://localhost/bundle.js:200:15)`;

        const expected = `Error: Network request failed
    at XMLHttpRequest.onError (https://cdn.example.com/lib.js) -> https://api.example.com/v1/users
    at async loadData (file:///Users/user/app/main.js:55:8)
    at main (https://localhost/bundle.js:200:15)`;

        expect(sanitizeStackTrace(stack)).toBe(expected);
    });
});
