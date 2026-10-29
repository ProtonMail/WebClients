import { needsMacSigningMigrationUpdate } from './needsMacSigningMigrationUpdate';

describe('needsMacSigningMigrationUpdate', () => {
    it.each([
        ['0.9.9', true],
        ['1.0.0', true],
        ['1.0.13', true],
        ['1.0.14', false],
        ['1.0.15', false],
        ['1.1.0', false],
        ['2.0.0', false],
    ])('for the Mac desktop app %s, returns %s', (version, expected) => {
        expect(needsMacSigningMigrationUpdate({ isMeetDesktopApp: true, isMac: true, version })).toBe(expected);
    });

    it('returns false for the desktop app on another OS', () => {
        expect(needsMacSigningMigrationUpdate({ isMeetDesktopApp: true, isMac: false, version: '1.0.13' })).toBe(false);
    });

    it('returns false outside the desktop app', () => {
        expect(needsMacSigningMigrationUpdate({ isMeetDesktopApp: false, isMac: false, version: undefined })).toBe(
            false
        );
    });

    it('returns false when the desktop app version is unknown', () => {
        expect(needsMacSigningMigrationUpdate({ isMeetDesktopApp: true, isMac: true, version: undefined })).toBe(false);
    });
});
