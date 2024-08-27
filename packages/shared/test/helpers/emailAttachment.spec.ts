import { setLocales } from '@proton/shared/lib/i18n';

import { mentionAttachment } from '../../lib/helpers/emailAttachment';

describe('mentionAttachment', () => {
    beforeAll(() => {
        // Set languageCode and localeCode to 'en'
        setLocales({ languageCode: 'en', localeCode: 'en_US' });
    });
    it('should return the correct mention', () => {
        const content = 'Hello Richard, please find the attached file.';
        const [result] = mentionAttachment(content) || [];
        expect(result).toBe('find the attached');
    });
    it('should return the correct mention when the attachment is at the end of the content', () => {
        const content = 'Hello Richard, please find the attached file';
        const [result] = mentionAttachment(content) || [];
        expect(result).toBe('find the attached');
    });
    it('should return the correct mention when the attachment is at the beginning of the content', () => {
        const content = 'Attached file: Hello Richard';
        const [result] = mentionAttachment(content) || [];
        expect(result).toBe('Attached file');
    });
});
