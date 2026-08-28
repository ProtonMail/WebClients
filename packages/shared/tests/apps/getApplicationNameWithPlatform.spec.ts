import { getApplicationNameWithPlatform } from '../../lib/apps/getApplicationNameWithPlatform';

describe('getApplicationNameWithPlatform', () => {
    const APP = 'MyApp';

    it('returns formatted name for Windows', () => {
        const result = getApplicationNameWithPlatform(APP, 'pass-windows');
        expect(result).toBe('MyApp for Windows');
    });

    it('returns formatted name for macOS', () => {
        const result = getApplicationNameWithPlatform(APP, 'mail-macos');
        expect(result).toBe('MyApp for macOS');
    });

    it('returns formatted name for GNU/Linux', () => {
        const result = getApplicationNameWithPlatform(APP, 'vpn-linux');
        expect(result).toBe('MyApp for GNU/Linux');
    });

    it('returns formatted name for iOS', () => {
        const result = getApplicationNameWithPlatform(APP, 'pass-ios');
        expect(result).toBe('MyApp for iOS');
    });

    it('returns formatted name for Android', () => {
        const result = getApplicationNameWithPlatform(APP, 'pass-android');
        expect(result).toBe('MyApp for Android');
    });

    it('returns formatted name for Web', () => {
        const result = getApplicationNameWithPlatform(APP, 'pass-web');
        expect(result).toBe('MyApp for Web');
    });

    it('returns the base name if no platform detected', () => {
        const result = getApplicationNameWithPlatform(APP, 'pass-unknown');
        expect(result).toBe('MyApp');
    });

    it('is case insensitive in clientID', () => {
        const result = getApplicationNameWithPlatform(APP, 'pass-WINDOWS');
        expect(result).toBe('MyApp for Windows');
    });
});
