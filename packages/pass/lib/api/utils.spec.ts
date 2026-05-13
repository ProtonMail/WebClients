import { isSessionResumeRoute } from './utils';

describe('`isSessionResumeRoute`', () => {
    test('should return false for undefined or empty url', () => {
        expect(isSessionResumeRoute(undefined)).toBe(false);
        expect(isSessionResumeRoute('')).toBe(false);
    });

    test('should allow connectivity probe', () => {
        expect(isSessionResumeRoute('tests/ping')).toBe(true);
    });

    test('should allow all session lock routes', () => {
        expect(isSessionResumeRoute('pass/v1/user/session/lock')).toBe(true);
        expect(isSessionResumeRoute('pass/v1/user/session/lock/check')).toBe(true);
        expect(isSessionResumeRoute('pass/v1/user/session/lock/unlock')).toBe(true);
        expect(isSessionResumeRoute('pass/v1/user/session/lock/force_lock')).toBe(true);
    });

    test('should allow resumeSession routes', () => {
        expect(isSessionResumeRoute('auth/v4/sessions/local/key')).toBe(true);
        expect(isSessionResumeRoute('core/v4/users')).toBe(true);
    });

    test('should allow refresh routes', () => {
        expect(isSessionResumeRoute('auth/refresh')).toBe(true);
        expect(isSessionResumeRoute('core/v4/auth')).toBe(true);
        expect(isSessionResumeRoute('core/v4/auth/cookies')).toBe(true);
    });

    test('should reject data routes', () => {
        expect(isSessionResumeRoute('pass/v1/share')).toBe(false);
        expect(isSessionResumeRoute('pass/v1/vault')).toBe(false);
        expect(isSessionResumeRoute('pass/v1/user/access')).toBe(false);
        expect(isSessionResumeRoute('pass/v1/user/srp')).toBe(false);
        expect(isSessionResumeRoute('pass/v1/user/srp/auth')).toBe(false);
    });

    test('should match by prefix not substring', () => {
        expect(isSessionResumeRoute('prefix/tests/ping')).toBe(false);
        expect(isSessionResumeRoute('prefix/core/v4/users')).toBe(false);
    });
});
