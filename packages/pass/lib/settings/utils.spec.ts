import { sanitizeSettings } from '@proton/pass/lib/settings/utils';
import { getInitialSettings } from '@proton/pass/store/reducers/settings';

describe('Settings utils', () => {
    describe('`sanitizeSettings`', () => {
        test('Should return in-place if `canCreateItems` is `true`', () => {
            const settings = getInitialSettings();
            const result = sanitizeSettings(settings, { canCreateItems: true });
            expect(result).toEqual(settings);
        });

        test('Should block relevant settings if `canCreateItems` is `false` ', () => {
            const settings = getInitialSettings();
            const result = sanitizeSettings(settings, { canCreateItems: false });
            expect(result).not.toEqual(settings);
            expect(result.autosave.prompt).toEqual(false);
            expect(result.autosave.passwordSuggest).toEqual(false);
            expect(result.passkeys.create).toEqual(false);
        });
    });
});
