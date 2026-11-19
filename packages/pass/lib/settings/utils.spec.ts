import { getInitialSettings } from '../../store/reducers/settings';
import { selectOrgPasskeyDisabled, selectOrgTOTPDisabled } from '../../store/selectors/organization';
import { selectCanCreateItems } from '../../store/selectors/shares';
import type { State } from '../../store/types';
import { sanitizeSettings } from './utils';

vi.mock('../../store/selectors/shares', () => ({
    selectCanCreateItems: vi.fn(),
}));

vi.mock('../../store/selectors/organization', () => ({
    selectOrgPasskeyDisabled: vi.fn(),
    selectOrgTOTPDisabled: vi.fn(),
}));

const mockSelectCanCreateItems = vi.mocked(selectCanCreateItems);
const mockSelectOrgTOTPDisabled = vi.mocked(selectOrgTOTPDisabled);
const mockSelectOrgPasskeyDisabled = vi.mocked(selectOrgPasskeyDisabled);
const state = {} as State;

describe('Settings utils', () => {
    describe('`sanitizeSettings`', () => {
        beforeEach(() => {
            mockSelectCanCreateItems.mockReturnValue(true);
            mockSelectOrgTOTPDisabled.mockReturnValue(false);
            mockSelectOrgPasskeyDisabled.mockReturnValue(false);
        });

        test('Should return in-place if nothing is restricted', () => {
            const settings = getInitialSettings();
            const result = sanitizeSettings(settings, state);
            expect(result).toBe(settings);
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

        test('Should block 2FA autofill and auto-copy if the organization disallows TOTP', () => {
            mockSelectOrgTOTPDisabled.mockReturnValue(true);
            const initial = getInitialSettings();
            const settings = { ...initial, autofill: { ...initial.autofill, twofa: true, twofaCopy: true } };
            const result = sanitizeSettings(settings, state);
            expect(result.autofill).toEqual({ ...initial.autofill, twofa: false, twofaCopy: false });
            expect(result.passkeys).toEqual(settings.passkeys);
        });

        test('Should block saving and authenticating with passkeys if the organization disallows passkeys', () => {
            mockSelectOrgPasskeyDisabled.mockReturnValue(true);
            const settings = getInitialSettings();
            const result = sanitizeSettings(settings, state);
            expect(result.passkeys).toEqual({ create: false, get: false });
            expect(result.autofill).toEqual(settings.autofill);
        });

        test('Should combine restrictions', () => {
            mockSelectCanCreateItems.mockReturnValue(false);
            mockSelectOrgTOTPDisabled.mockReturnValue(true);
            const result = sanitizeSettings(getInitialSettings(), state);
            expect(result.autosave.prompt).toEqual(false);
            expect(result.passkeys.create).toEqual(false);
            expect(result.autofill.twofa).toEqual(false);
            expect(result.autofill.twofaCopy).toEqual(false);
        });
    });
});
