import { assertValidPasskeyRequest } from './passkey';

describe('assertValidPasskeyRequest', () => {
    test('should throw error when domain is not defined', () => {
        const hostname = undefined;
        const tabUrl = new URL('https://example.com/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).toThrow('Invalid request: no domain');
    });

    test('should throw error when sender URL is missing', () => {
        const hostname = 'example.com';
        const tabUrl = undefined;
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).toThrow('Invalid request: unknown sender');
    });

    test('should throw error when domain does not match sender hostname', () => {
        const hostname = 'example.com';
        const tabUrl = new URL('https://malicious.com/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).toThrow('Invalid request: domain mistmatch');
    });

    test('should throw error for subdomain mismatch', () => {
        const hostname = 'example.com';
        const tabUrl = new URL('https://sub.example.com/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).toThrow('Invalid request: domain mistmatch');
    });

    test('should pass for valid domain and matching sender URL', () => {
        const hostname = 'example.com';
        const tabUrl = new URL('https://example.com/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).not.toThrow();
    });

    test('should pass for subdomains when they match exactly', () => {
        const hostname = 'sub.example.com';
        const tabUrl = new URL('https://sub.example.com/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).not.toThrow();
    });

    test('should throw for http protocol on non-localhost', () => {
        const hostname = 'example.com';
        const tabUrl = new URL('http://example.com/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).toThrow('Invalid request: insecure protocol');
    });

    test('should pass if port in URL correctly', () => {
        const hostname = 'example.com';
        const tabUrl = new URL('https://example.com:8080/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).not.toThrow();
    });

    test('should allow http for localhost', () => {
        const hostname = 'localhost';
        const tabUrl = new URL('http://localhost/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).not.toThrow();
    });

    test('should allow http for localhost with port', () => {
        const hostname = 'localhost';
        const tabUrl = new URL('http://localhost:8000/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).not.toThrow();
    });

    test('should allow https for localhost', () => {
        const hostname = 'localhost';
        const tabUrl = new URL('https://localhost/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).not.toThrow();
    });

    test('should reject http for 127.0.0.1 (not localhost hostname)', () => {
        const hostname = '127.0.0.1';
        const tabUrl = new URL('http://127.0.0.1/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).toThrow('Invalid request: insecure protocol');
    });

    test('should reject other protocols', () => {
        const hostname = 'example.com';
        const tabUrl = new URL('data:text/html,<html>test</html>');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).toThrow();
    });
});
