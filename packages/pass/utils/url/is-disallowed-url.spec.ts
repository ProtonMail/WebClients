import { DisallowedAutoCriteria } from '@proton/pass/types/worker/settings';

import { isDisallowedUrl } from './is-disallowed-url';

describe('Is in disallowed autoX settings', () => {
    const mockedDissallowAutoXSettings = {
        noAutoFill: ['no.autofill.com', 'noautofill.test'],
        noAutoSave: ['no.auto-save.com', 'noautosave.test'],
        noAutoSuggestion: ['no.auto-suggest.com', 'noautosuggestions.test'],
        noAuto2FA: ['no.auto2fa.com', 'noauto2fa.test'],
    };

    describe('should return true if the hostname is in list based on the criteria', () =>
        test.each([
            ['no.autofill.com', DisallowedAutoCriteria.AUTOFILL],
            ['noautofill.test', DisallowedAutoCriteria.AUTOFILL],
            ['noautosave.test', DisallowedAutoCriteria.AUTOSAVE],
            ['no.auto-suggest.com', DisallowedAutoCriteria.AUTOSUGGESTION],
            ['noauto2fa.test', DisallowedAutoCriteria.AUTO2FA],
        ])('test url %p, criteria %p', (testUrl, testCriteria) => {
            expect(isDisallowedUrl(testUrl, testCriteria, mockedDissallowAutoXSettings)).toBe(true);
        }));

    describe('shold return false when the hostname is not in dissallowed list base on criteria', () =>
        test.each([
            DisallowedAutoCriteria.AUTOFILL,
            DisallowedAutoCriteria.AUTOSAVE,
            DisallowedAutoCriteria.AUTOSUGGESTION,
            DisallowedAutoCriteria.AUTO2FA,
        ])('test criteria %p', (testCriteria) => {
            expect(isDisallowedUrl('test.com', testCriteria, mockedDissallowAutoXSettings)).toBe(false);
        }));

    test('shold return false when the hostname ny subdomail is not in dissallowed list base on criteria', () => {
        expect(isDisallowedUrl('yes.autofill.com', DisallowedAutoCriteria.AUTOFILL, mockedDissallowAutoXSettings)).toBe(
            false
        );
    });
});
