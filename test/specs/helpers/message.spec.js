import {
    isDraft, isExternalEncrypted, isPGPInline, isMIME, normalizeRecipients, isReceived
} from '../../../src/helpers/message';
import { MESSAGE_FLAGS, MIME_TYPES } from '../../../src/app/constants';

describe('Flag helpers', () => {
    it('should handle draft', () => {
        expect(isDraft({ Flags: 0 }))
            .toBe(true);
        expect(isDraft({ Flags: MESSAGE_FLAGS.FLAG_RECEIVED }))
            .toBe(false);
        expect(isDraft({ Flags: MESSAGE_FLAGS.FLAG_SENT }))
            .toBe(false);
        expect(isDraft({ Flags: MESSAGE_FLAGS.FLAG_SENT | MESSAGE_FLAGS.FLAG_RECEIVED }))
            .toBe(false);
        expect(isDraft({ Flags: MESSAGE_FLAGS.FLAG_RECEIPT_REQUEST }))
            .toBe(true);
    });

    it('should handle received', () => {
        expect(isReceived({ Flags: 0 }))
            .toBe(false);
        expect(isReceived({ Flags: MESSAGE_FLAGS.FLAG_RECEIVED }))
            .toBe(true);
        expect(isReceived({ Flags: MESSAGE_FLAGS.FLAG_SENT }))
            .toBe(false);
        expect(isReceived({ Flags: MESSAGE_FLAGS.FLAG_SENT | MESSAGE_FLAGS.FLAG_RECEIVED }))
            .toBe(true);
    });

    it('should handle external encrypted', () => {
        expect(isExternalEncrypted({ Flags: MESSAGE_FLAGS.FLAG_E2E | MESSAGE_FLAGS.FLAG_INTERNAL }))
            .toBe(false);
        expect(isExternalEncrypted({ Flags: MESSAGE_FLAGS.FLAG_INTERNAL }))
            .toBe(false);
        expect(isExternalEncrypted({ Flags: MESSAGE_FLAGS.FLAG_E2E }))
            .toBe(true);
        expect(isExternalEncrypted({ Flags: 0 }))
            .toBe(false);
    });

    it('should handle mime', () => {
        expect(isMIME({ Flags: MESSAGE_FLAGS.FLAG_RECEIVED | MESSAGE_FLAGS.FLAG_E2E, MIMEType: MIME_TYPES.MIME }))
            .toBe(true);
        expect(isMIME({ Flags: MESSAGE_FLAGS.FLAG_RECEIVED | MESSAGE_FLAGS.FLAG_E2E, MIMEType: MIME_TYPES.PLAINTEXT }))
            .toBe(false);
        expect(isMIME({ Flags: MESSAGE_FLAGS.FLAG_E2E, MIMEType: MIME_TYPES.MIME }))
            .toBe(true);
        expect(isMIME({ Flags: MESSAGE_FLAGS.FLAG_RECEIVED, MIMEType: MIME_TYPES.MIME }))
            .toBe(true);
    });

    it('should handle pgp inline', () => {
        expect(isPGPInline({
            Flags: MESSAGE_FLAGS.FLAG_RECEIVED | MESSAGE_FLAGS.FLAG_E2E,
            MIMEType: MIME_TYPES.PLAINTEXT
        }))
            .toBe(true);
        expect(isPGPInline({
            Flags: MESSAGE_FLAGS.FLAG_RECEIVED | MESSAGE_FLAGS.FLAG_E2E,
            MIMEType: MIME_TYPES.DEFAULT
        }))
            .toBe(true);
        expect(isPGPInline({ Flags: MESSAGE_FLAGS.FLAG_RECEIVED | MESSAGE_FLAGS.FLAG_E2E, MIMEType: MIME_TYPES.MIME }))
            .toBe(false);
    });
});

describe('Recipients', () => {
    it('should handle no parameters', () => {
        expect(normalizeRecipients({}))
            .toEqual([]);
    });

    it('should normalize all recipients', () => {
        expect(normalizeRecipients({
            ToList: [{ Address: 'ASD' }],
            CCList: [{ Address: 'abc' }],
            BCCList: [{ Address: 'bca' }]
        }))
            .toEqual(['asd', 'abc', 'bca']);
    });
});

