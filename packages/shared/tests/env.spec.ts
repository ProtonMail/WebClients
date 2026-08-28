import { isDevOrBlackHost, isLocalHost } from '../lib/env';

describe('Env', () => {
    describe('isLocalHost', () => {
        it('should return true when host includes proton.dev', () => {
            expect(isLocalHost('app.proton.dev')).toBe(true);
        });

        it('should return true when host is exactly proton.dev', () => {
            expect(isLocalHost('proton.dev')).toBe(true);
        });

        it('should return false when host does not include proton.dev', () => {
            expect(isLocalHost('mail.proton.me')).toBe(false);
        });
    });

    describe('isDevOrBlackHost', () => {
        it('should return true when host includes proton.dev', () => {
            expect(isDevOrBlackHost('app.proton.dev')).toBe(true);
        });

        it('should return true when host ends with proton.black', () => {
            expect(isDevOrBlackHost('app.proton.black')).toBe(true);
        });

        it('should return true when host is exactly proton.black', () => {
            expect(isDevOrBlackHost('proton.black')).toBe(true);
        });

        it('should return false when host is neither local nor ends with proton.black', () => {
            expect(isDevOrBlackHost('mail.proton.me')).toBe(false);
        });

        it('should return false when host contains proton.black but does not end with it', () => {
            expect(isDevOrBlackHost('proton.black.example.com')).toBe(false);
        });
    });
});
