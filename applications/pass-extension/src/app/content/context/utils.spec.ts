import { CRITERIA_MASKS } from '@proton/pass/types/worker/settings';
import { parseUrl } from '@proton/pass/utils/url/parser';

import { hasPauseCriteria } from './utils';

describe('hasPauseCriteria', () => {
    it('should return false for all criterias when domain pauselist is empty', () => {
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

    it('should return false for all criterias when URL does not exist in pauselist', () => {
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

    it('should correctly parse criterias for a matching domain', () => {
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

    it('should merge domain and subdomain masks correctly', () => {
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

    it('should correctly handle URLs with port/query parameters/fragments', () => {
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
});
