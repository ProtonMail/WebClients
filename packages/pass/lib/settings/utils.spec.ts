import { sanitizeSettings } from '@proton/pass/lib/settings/utils';
import { getInitialSettings } from '@proton/pass/store/reducers/settings';
import { selectCanCreateItems } from '@proton/pass/store/selectors/shares';
import type { State } from '@proton/pass/store/types';

jest.mock('@proton/pass/store/selectors/shares', () => ({
    selectCanCreateItems: jest.fn(),
}));

const mockSelectCanCreateItems = jest.mocked(selectCanCreateItems);
const state = {} as State;

describe('Settings utils', () => {
    describe('`sanitizeSettings`', () => {
        beforeEach(() => {
            mockSelectCanCreateItems.mockReturnValue(true);
        });

        test('Should return in-place if `canCreateItems` is `true`', () => {
            const settings = getInitialSettings();
            const result = sanitizeSettings(settings, state);
            expect(result).toEqual(settings);
        });

        test('Should block relevant settings if `canCreateItems` is `false` ', () => {
            mockSelectCanCreateItems.mockReturnValue(false);
            const settings = getInitialSettings();
            const result = sanitizeSettings(settings, state);
            expect(result).not.toEqual(settings);
            expect(result.autosave.prompt).toEqual(false);
            expect(result.autosave.passwordSuggest).toEqual(false);
            expect(result.passkeys.create).toEqual(false);
        });
    });
});
