import { toggleCriteria } from '@proton/pass/lib/settings/pause-list';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { RecursivePartial } from '@proton/pass/types';
import { parseUrl } from '@proton/pass/utils/url/parser';

import { computeFeatures, shouldEnableDetector, shouldInjectContentScript } from './features';

describe('computeFeatures', () => {
    const createSettings = (overrides: RecursivePartial<ProxiedSettings> = {}): ProxiedSettings =>
        ({
            disallowedDomains: {},
            autofill: { login: false, identity: false, twofa: false, cc: false },
            autosuggest: { email: false, password: false },
            autosave: { prompt: false },
            passkeys: { create: false, get: false },
            ...overrides,
        }) as any;

    test('should return all false when all settings disabled', () => {
        const settings = createSettings();
        const result = computeFeatures(settings, null, null);

        expect(result.Autofill).toBe(false);
        expect(result.Passkeys).toBe(false);
    });

    test('should enable autofill when login or identity enabled', () => {
        const settings = createSettings({ autofill: { login: true } });
        expect(computeFeatures(settings, null, null).Autofill).toBe(true);

        const settings2 = createSettings({ autofill: { identity: true } });
        expect(computeFeatures(settings2, null, null).Autofill).toBe(true);
    });

    test('should respect pause list', () => {
        const settings = createSettings({
            disallowedDomains: { 'example.com': toggleCriteria(0, 'Autofill') },
            autofill: { login: true },
        });
        const frameUrl = parseUrl('https://example.com/login');
        const result = computeFeatures(settings, frameUrl, null);

        expect(result.Autofill).toBe(false);
    });

    test('should combine frame and tab pause criteria', () => {
        const settings = createSettings({
            disallowedDomains: {
                'frame.com': toggleCriteria(0, 'Autofill'),
                'tab.com': toggleCriteria(0, 'Autofill2FA'),
            },
            autofill: { login: true, twofa: true },
        });

        const frameUrl = parseUrl('https://frame.com');
        const tabUrl = parseUrl('https://tab.com');
        const result = computeFeatures(settings, frameUrl, tabUrl);

        expect(result.Autofill).toBe(false);
        expect(result.Autofill2FA).toBe(false);
    });

    test('should enable passkeys with either permission', () => {
        const settings = createSettings({ passkeys: { create: true } });
        expect(computeFeatures(settings, null, null).Passkeys).toBe(true);

        const getSettings = createSettings({ passkeys: { get: true } });
        expect(computeFeatures(getSettings, null, null).Passkeys).toBe(true);
    });
});

describe('shouldEnableDetector', () => {
    test('should return false for passkeys only', () => {
        const features = {
            Passkeys: true,
            Autofill: false,
            Autofill2FA: false,
            Autosave: false,
            AutosuggestAlias: false,
            AutosuggestPassword: false,
            CreditCard: false,
        };
        expect(shouldEnableDetector(features)).toBe(false);
    });

    test('should return true for detector features', () => {
        const features = {
            Autofill: true,
            Passkeys: false,
            Autofill2FA: false,
            Autosave: false,
            AutosuggestAlias: false,
            AutosuggestPassword: false,
            CreditCard: false,
        };
        expect(shouldEnableDetector(features)).toBe(true);
    });
});

describe('shouldInjectContentScript', () => {
    test('should return false when all features disabled', () => {
        const features = {
            Autofill: false,
            Autofill2FA: false,
            Autosave: false,
            AutosuggestAlias: false,
            AutosuggestPassword: false,
            CreditCard: false,
            Passkeys: false,
        };
        expect(shouldInjectContentScript(features)).toBe(false);
    });

    test('should return true for detector features', () => {
        const features = {
            Autofill: true,
            Autofill2FA: false,
            Autosave: false,
            AutosuggestAlias: false,
            AutosuggestPassword: false,
            CreditCard: false,
            Passkeys: false,
        };
        expect(shouldInjectContentScript(features)).toBe(true);
    });

    test('should return true for passkeys only', () => {
        const features = {
            Autofill: false,
            Autofill2FA: false,
            Autosave: false,
            AutosuggestAlias: false,
            AutosuggestPassword: false,
            CreditCard: false,
            Passkeys: true,
        };
        expect(shouldInjectContentScript(features)).toBe(true);
    });
});
