import { isDevOrBlack, isLocalEnvironment } from './env';

describe('Env', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'location', {
            value: { host: '' },
            writable: true,
        });
    });

    describe('isLocalEnvironment', () => {
        test('should return true when host includes proton.local', () => {
            Object.defineProperty(window, 'location', {
                value: { host: 'app.proton.local' },
            });
            expect(isLocalEnvironment()).toBe(true);
        });

        test('should return true when host is exactly proton.local', () => {
            Object.defineProperty(window, 'location', {
                value: { host: 'proton.local' },
            });
            expect(isLocalEnvironment()).toBe(true);
        });

        test('should return false when host does not include proton.local', () => {
            Object.defineProperty(window, 'location', {
                value: { host: 'mail.proton.me' },
            });
            expect(isLocalEnvironment()).toBe(false);
        });
    });

    describe('isDevOrBlack', () => {
        test('should return true when host includes proton.local', () => {
            window.location.host = 'app.proton.local';
            expect(isDevOrBlack()).toBe(true);
        });

        test('should return true when host ends with proton.black', () => {
            Object.defineProperty(window, 'location', {
                value: { host: 'app.proton.black' },
            });
            expect(isDevOrBlack()).toBe(true);
        });

        test('should return true when host is exactly proton.black', () => {
            Object.defineProperty(window, 'location', {
                value: { host: 'proton.black' },
            });
            expect(isDevOrBlack()).toBe(true);
        });

        test('should return false when host is neither local nor ends with proton.black', () => {
            window.location.host = 'mail.proton.me';
            expect(isDevOrBlack()).toBe(false);
        });

        test('should return false when host contains proton.black but does not end with it', () => {
            Object.defineProperty(window, 'location', {
                value: { host: 'proton.black.example.com' },
            });
            expect(isDevOrBlack()).toBe(false);
        });
    });
});
