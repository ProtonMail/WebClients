import { isMailVersionOlderThan } from '../../lib/mobile/isMailVersionOlderThan';

describe('isMailVersionOlderThan', () => {
    it('should return false if no version', () => {
        expect(isMailVersionOlderThan(null, 'ios', '7.0.2')).toBeFalsy();
    });

    it('should return false if platform is not matching', () => {
        expect(isMailVersionOlderThan('android-mail@7.0.2', 'ios', '7.0.2')).toBeFalsy();
    });

    it('should return false if version is invalid', () => {
        expect(isMailVersionOlderThan('android-mail@7.0', 'ios', '7.0.2')).toBeFalsy();
        expect(isMailVersionOlderThan('android-mail@a.b.c', 'ios', '7.0.2')).toBeFalsy();
    });

    it('should return false if versions are equal', () => {
        expect(isMailVersionOlderThan('ios-mail@7.0.2', 'ios', '7.0.2')).toBeFalsy();
    });

    it('should return true if versions are older', () => {
        expect(isMailVersionOlderThan('ios-mail@7.0.2', 'ios', '7.0.1')).toBeFalsy();
        expect(isMailVersionOlderThan('android-mail@7.0.2', 'ios', '7.0.1')).toBeFalsy();
    });
});
