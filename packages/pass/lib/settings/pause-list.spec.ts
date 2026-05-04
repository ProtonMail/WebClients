import { CRITERIA_MASKS, hasPauseCriteria, intoPauseCriterias } from '@proton/pass/lib/settings/pause-list';
import type { OrganizationUrlPauseEntryDto, OrganizationUrlPauseEntryValues } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { parseUrl } from '@proton/pass/utils/url/parser';

describe('hasPauseCriteria', () => {
    test('should return false for all criterias when domain pauselist is empty', () => {
        const params = {
            disallowedDomains: {},
            url: parseUrl('https://sub.example.com'),
        };
        const result = hasPauseCriteria(params);
        expect(result).toEqual({
            Autofill: false,
            Autofill2FA: false,
            Autosave: false,
            Autosuggest: false,
            Passkey: false,
        });
    });

    test('should return false for all criterias when URL does not exist in pauselist', () => {
        const params = {
            disallowedDomains: {
                'anotherdomain.test': CRITERIA_MASKS.Autosuggest,
            },
            url: parseUrl('https://example.com'),
        };
        const result = hasPauseCriteria(params);
        expect(result).toEqual({
            Autofill: false,
            Autofill2FA: false,
            Autosave: false,
            Autosuggest: false,
            Passkey: false,
        });
    });

    test('should correctly parse criterias for a matching domain', () => {
        const params = {
            disallowedDomains: {
                'example.com': CRITERIA_MASKS.Autofill | CRITERIA_MASKS.Autosuggest,
            },
            url: parseUrl('https://example.com'),
        };
        const result = hasPauseCriteria(params);
        expect(result).toEqual({
            Autofill: true,
            Autofill2FA: false,
            Autosave: false,
            Autosuggest: true,
            Passkey: false,
        });
    });

    test('should merge domain and subdomain masks correctly', () => {
        const params = {
            disallowedDomains: {
                'example.com': CRITERIA_MASKS.Autosave,
                'sub.example.com': CRITERIA_MASKS.Autofill | CRITERIA_MASKS.Passkey,
            },
            url: parseUrl('https://sub.example.com'),
        };
        const result = hasPauseCriteria(params);
        expect(result).toEqual({
            Autofill: true,
            Autofill2FA: false,
            Autosave: true,
            Autosuggest: false,
            Passkey: true,
        });
    });

    test('should correctly handle URLs with port/query parameters/fragments', () => {
        const params = {
            disallowedDomains: {
                'example.com': CRITERIA_MASKS.Autosuggest,
            },
            url: parseUrl('https://example.com:8080/path?param=value#section'),
        };
        const result = hasPauseCriteria(params);
        expect(result).toEqual({
            Autofill: false,
            Autofill2FA: false,
            Autosave: false,
            Autosuggest: true,
            Passkey: false,
        });
    });

    test('should pause when domain is only in `orgDomains`', () => {
        const result = hasPauseCriteria({
            disallowedDomains: {},
            orgDomains: { 'org.com': CRITERIA_MASKS.Autofill },
            url: parseUrl('https://org.com'),
        });

        expect(result).toEqual({
            Autofill: true,
            Autofill2FA: false,
            Autosave: false,
            Autosuggest: false,
            Passkey: false,
        });
    });

    test('should `OR` user and org masks for a shared hostname', () => {
        const result = hasPauseCriteria({
            disallowedDomains: { 'shared.com': CRITERIA_MASKS.Autosave },
            orgDomains: { 'shared.com': CRITERIA_MASKS.Autofill },
            url: parseUrl('https://shared.com'),
        });

        expect(result.Autofill).toBe(true);
        expect(result.Autosave).toBe(true);
        expect(result.Autosuggest).toBe(false);
    });

    test('should respect org subdomain', () => {
        const result = hasPauseCriteria({
            disallowedDomains: {},
            orgDomains: { 'sub.example.com': CRITERIA_MASKS.Autosuggest },
            url: parseUrl('https://sub.example.com/path'),
        });

        expect(result.Autosuggest).toBe(true);
        expect(result.Autofill).toBe(false);
    });

    test('should not throw and return defaults when `orgDomains` is `undefined`', () => {
        const result = hasPauseCriteria({
            disallowedDomains: {},
            orgDomains: undefined,
            url: parseUrl('https://example.com'),
        });

        expect(result).toEqual({
            Autofill: false,
            Autofill2FA: false,
            Autosave: false,
            Autosuggest: false,
            Passkey: false,
        });
    });
});

describe('intoPauseCriterias', () => {
    const createPauseListEntry = (
        Url: string,
        Values: OrganizationUrlPauseEntryValues
    ): OrganizationUrlPauseEntryDto => ({
        Url,
        EntryID: uniqueId(),
        CreateTime: getEpoch(),
        Values,
    });

    test('should handle empty pause-list', () => {
        const result = intoPauseCriterias([]);
        expect(result).toEqual({});
    });

    test('should skip empty URLs', () => {
        const result = intoPauseCriterias([
            createPauseListEntry('', {
                Autofill2faEnabled: false,
                AutofillAutosuggestEnabled: false,
                AutofillEnabled: false,
                AutosaveEnabled: false,
                PasskeysEnabled: false,
            }),
        ]);
        expect(result).toEqual({});
    });

    test('should skip malformed URLs', () => {
        const result = intoPauseCriterias([
            createPauseListEntry('!malformed@#', {
                Autofill2faEnabled: false,
                AutofillAutosuggestEnabled: false,
                AutofillEnabled: false,
                AutosaveEnabled: false,
                PasskeysEnabled: false,
            }),
        ]);

        expect(result).toEqual({});
    });

    test('should skip all-enabled entries', () => {
        const result = intoPauseCriterias([
            createPauseListEntry('all-enabled.com', {
                Autofill2faEnabled: true,
                AutofillAutosuggestEnabled: true,
                AutofillEnabled: true,
                AutosaveEnabled: true,
                PasskeysEnabled: true,
            }),
        ]);

        expect(result).toEqual({});
    });

    test('should handle partial entries', () => {
        const result = intoPauseCriterias([
            createPauseListEntry('partial-autofill.com', {
                Autofill2faEnabled: true,
                AutofillAutosuggestEnabled: false,
                AutofillEnabled: true,
                AutosaveEnabled: false,
                PasskeysEnabled: false,
            }),

            createPauseListEntry('partial-passkeys.com', {
                Autofill2faEnabled: true,
                AutofillAutosuggestEnabled: false,
                AutofillEnabled: false,
                AutosaveEnabled: false,
                PasskeysEnabled: true,
            }),

            createPauseListEntry('partial-autosave.com', {
                Autofill2faEnabled: true,
                AutofillAutosuggestEnabled: true,
                AutofillEnabled: true,
                AutosaveEnabled: false,
                PasskeysEnabled: true,
            }),
        ]);

        expect(result).toStrictEqual({
            'partial-autofill.com': CRITERIA_MASKS.Autosave | CRITERIA_MASKS.Autosuggest | CRITERIA_MASKS.Passkey,
            'partial-passkeys.com': CRITERIA_MASKS.Autofill | CRITERIA_MASKS.Autosuggest | CRITERIA_MASKS.Autosave,
            'partial-autosave.com': CRITERIA_MASKS.Autosave,
        });
    });

    test('should handle fully disabled entries', () => {
        const result = intoPauseCriterias([
            createPauseListEntry('fully-disabled.com', {
                Autofill2faEnabled: false,
                AutofillAutosuggestEnabled: false,
                AutofillEnabled: false,
                AutosaveEnabled: false,
                PasskeysEnabled: false,
            }),
        ]);

        expect(result).toStrictEqual({
            'fully-disabled.com':
                CRITERIA_MASKS.Autofill |
                CRITERIA_MASKS.Autosuggest |
                CRITERIA_MASKS.Autosave |
                CRITERIA_MASKS.Autofill2FA |
                CRITERIA_MASKS.Passkey,
        });
    });
});
