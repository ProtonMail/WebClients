import { MIME_TYPES } from '@proton/shared/lib/constants';

import { normalize } from './normalize';

const base = { subject: '', body: '', mimeType: MIME_TYPES.DEFAULT, timestamp: 0 };

describe('OTP normalize', () => {
    it('NFKC-normalizes the subject', () => {
        expect(normalize({ ...base, subject: '１２３' }).subject).toBe('123');
    });

    it('derives plain kind only for the plaintext MIME type', () => {
        expect(normalize({ ...base, mimeType: MIME_TYPES.PLAINTEXT }).kind).toBe('plain');
        expect(normalize({ ...base, mimeType: MIME_TYPES.DEFAULT }).kind).toBe('html');
    });

    it('is null-safe for missing subject and body', () => {
        const result = normalize({ ...base, subject: undefined as any, body: undefined as any });
        expect(result.subject).toBe('');
        expect(result.body).toBe('');
    });
});
