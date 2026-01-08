import { assertValidPasskeyRequest } from './passkey';

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
