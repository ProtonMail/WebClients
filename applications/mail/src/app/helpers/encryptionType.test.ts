import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';

import { I18N, getEncryptionType, getFromType } from './encryptionType';

describe('getFromType', () => {
    it('should be sent encrypted', () => {
        const message = {
            Flags: MESSAGE_FLAGS.FLAG_E2E | MESSAGE_FLAGS.FLAG_SENT,
        } as Message;

        expect(getFromType(message)).toEqual(I18N.sentEncrypted);
    });

    it('should be auto', () => {
        const message = {
            Flags: MESSAGE_FLAGS.FLAG_AUTO,
        } as Message;

        expect(getFromType(message)).toEqual(I18N.auto);
    });

    it('should be sent', () => {
        const message = {
            Flags: MESSAGE_FLAGS.FLAG_SENT,
        } as Message;

        expect(getFromType(message)).toEqual(I18N.sentClear);
    });

    it('should be a draft', () => {
        const message = {
            Flags: 0,
        } as Message;

        expect(getFromType(message)).toEqual(I18N.draft);
    });

    it('should be internal encrypted', () => {
        const message = {
            Flags: MESSAGE_FLAGS.FLAG_E2E | MESSAGE_FLAGS.FLAG_INTERNAL | MESSAGE_FLAGS.FLAG_RECEIVED,
        } as Message;

        expect(getFromType(message)).toEqual(I18N.pm);
    });

    it('should be external encrypted', () => {
        const message = {
            Flags: MESSAGE_FLAGS.FLAG_E2E | MESSAGE_FLAGS.FLAG_RECEIVED,
        } as Message;

        expect(getFromType(message)).toEqual(I18N.pgp);
    });

    it('should be clear', () => {
        const message = {
            Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
        } as Message;

        expect(getFromType(message)).toEqual(I18N.clear);
    });
});

describe('getEncryptionType', () => {
    it('should return the encryption type', () => {
        const message = {
            Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
        } as Message;

        expect(getEncryptionType({ data: message, verified: 1 })).toEqual(I18N.clear[1]);
    });

    it('should return encryption type for old messages', () => {
        const message = {
            Time: 0,
            Flags: MESSAGE_FLAGS.FLAG_E2E | MESSAGE_FLAGS.FLAG_SENT,
        } as Message;

        expect(getEncryptionType({ data: message, verified: 2 })).toEqual(I18N.sentEncrypted[0]);
    });

    it('should return default encryption type when verified is to big', () => {
        const message = {
            Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
        } as Message;

        expect(getEncryptionType({ data: message, verified: 10 })).toEqual(I18N.clear[0]);
    });
});
