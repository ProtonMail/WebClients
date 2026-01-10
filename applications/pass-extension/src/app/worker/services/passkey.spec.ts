import { assertValidPasskeyRequest, isSecureLocalhost } from './passkey';

describe('assertValidPasskeyRequest', () => {
    test('should throw error when domain is not defined', () => {
        const domain = undefined;
        const tabUrl = 'https://example.com/path';
        expect(() => assertValidPasskeyRequest(domain, tabUrl)).toThrow('Invalid passkey request: no domain');
    });

    test('should throw error when sender URL is missing', () => {
        const domain = 'example.com';
        const tabUrl = undefined;
        expect(() => assertValidPasskeyRequest(domain, tabUrl)).toThrow('Invalid passkey request: unknown sender');
    });

    test('should throw error when domain does not match sender hostname', () => {
        const domain = 'example.com';
        const tabUrl = 'https://malicious.com/path';
        expect(() => assertValidPasskeyRequest(domain, tabUrl)).toThrow('Invalid passkey request: domain mistmatch');
    });

    test('should throw error for subdomain mismatch', () => {
        const domain = 'example.com';
        const tabUrl = 'https://sub.example.com/path';
        expect(() => assertValidPasskeyRequest(domain, tabUrl)).toThrow('Invalid passkey request: domain mistmatch');
    });

    test('should pass for valid domain and matching sender URL', () => {
        const domain = 'example.com';
        const tabUrl = 'https://example.com/path';
        expect(() => assertValidPasskeyRequest(domain, tabUrl)).not.toThrow();
    });

    test('should pass for subdomains when they match exactly', () => {
        const domain = 'sub.example.com';
        const tabUrl = 'https://sub.example.com/path';
        expect(() => assertValidPasskeyRequest(domain, tabUrl)).not.toThrow();
    });

    test('should pass for different protocols', () => {
        const domain = 'example.com';
        const tabUrl = 'http://example.com/path';
        expect(() => assertValidPasskeyRequest(domain, tabUrl)).not.toThrow();
    });

    test('should pass if port in URL correctly', () => {
        const domain = 'example.com';
        const tabUrl = 'https://example.com:8080/path';
        expect(() => assertValidPasskeyRequest(domain, tabUrl)).not.toThrow();
    });
});

describe('isSecureLocalhost', () => {
    test('should return true for secure localhost URL', () => {
        expect(isSecureLocalhost('https://localhost')).toBe(true);
        expect(isSecureLocalhost('https://localhost/')).toBe(true);
        expect(isSecureLocalhost('https://localhost/path')).toBe(true);
        expect(isSecureLocalhost('https://localhost:8080')).toBe(true);
        expect(isSecureLocalhost('https://localhost:3000/path')).toBe(true);
    });

    test('should return false for insecure localhost URL', () => {
        expect(isSecureLocalhost('http://localhost')).toBe(false);
        expect(isSecureLocalhost('http://localhost/')).toBe(false);
        expect(isSecureLocalhost('http://localhost:8080')).toBe(false);
    });

    test('should return false for non-localhost hostnames', () => {
        expect(isSecureLocalhost('https://example.com')).toBe(false);
        expect(isSecureLocalhost('https://127.0.0.1')).toBe(false);
        expect(isSecureLocalhost('https://sub.localhost')).toBe(false);
    });

    test('should return false for invalid or missing URLs', () => {
        expect(isSecureLocalhost(undefined)).toBe(false);
        expect(isSecureLocalhost('')).toBe(false);
    });
});
