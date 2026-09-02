import { getMailBugCategoryValues, getMailOptions } from './bugCategories';

describe('getMailBugCategoryValues', () => {
    it('returns the untranslated option values, dropping the group headings', () => {
        const groupHeadings = getMailOptions({ isAuthenticatorAvailable: true })
            .filter((option) => option.type === 'label')
            .map(({ value }) => value);

        const values = getMailBugCategoryValues();

        expect(values).toContain('Mail problem');
        expect(values).toEqual(expect.not.arrayContaining(groupHeadings));
    });

    it('includes the flag-gated Authenticator category the form itself may hide', () => {
        const withFlagOff = getMailOptions({ isAuthenticatorAvailable: false }).map(({ value }) => value);

        expect(withFlagOff).not.toContain('Authenticator problem');
        expect(getMailBugCategoryValues()).toContain('Authenticator problem');
    });
});
