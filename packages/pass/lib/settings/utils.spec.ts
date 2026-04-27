import { CRITERIA_MASKS } from '@proton/pass/lib/settings/pause-list';
import { sanitizeSettings } from '@proton/pass/lib/settings/utils';
import { getInitialSettings } from '@proton/pass/store/reducers/settings';
import { selectOrgDisallowedDomains } from '@proton/pass/store/selectors/organization';
import { selectCanCreateItems } from '@proton/pass/store/selectors/shares';
import type { State } from '@proton/pass/store/types';

jest.mock('@proton/pass/store/selectors/shares', () => ({
    selectCanCreateItems: jest.fn(),
}));

jest.mock('@proton/pass/store/selectors/organization', () => ({
    selectOrgDisallowedDomains: jest.fn(),
}));

const mockSelectCanCreateItems = jest.mocked(selectCanCreateItems);
const mockSelectOrgDisallowedDomains = jest.mocked(selectOrgDisallowedDomains);
const state = {} as State;

describe('Settings utils', () => {
    describe('`sanitizeSettings`', () => {
        beforeEach(() => {
            mockSelectCanCreateItems.mockReturnValue(true);
            mockSelectOrgDisallowedDomains.mockReturnValue({});
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

        test('Should merge organization pause list on top of user pause list', () => {
            mockSelectOrgDisallowedDomains.mockReturnValue({
                'example.test': CRITERIA_MASKS.Autofill,
                'shared.test': CRITERIA_MASKS.Autofill2FA,
            });
            const settings = {
                ...getInitialSettings(),
                disallowedDomains: {
                    'shared.test': CRITERIA_MASKS.Autosuggest,
                    'user.test': CRITERIA_MASKS.Autosave,
                },
            };
            const result = sanitizeSettings(settings, state);
            expect(result.disallowedDomains).toEqual({
                'example.test': CRITERIA_MASKS.Autofill,
                'shared.test': CRITERIA_MASKS.Autofill2FA | CRITERIA_MASKS.Autosuggest,
                'user.test': CRITERIA_MASKS.Autosave,
            });
        });
    });
});
