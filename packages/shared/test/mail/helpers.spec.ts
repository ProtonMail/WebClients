import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { clearFlag, hasFlag, setFlag, toggleFlag } from '@proton/shared/lib/mail/messages';

describe('hasFlag', () => {
    it('should detect correctly that the message has a flag', () => {
        const message = {
            Flags: MESSAGE_FLAGS.FLAG_SENT,
        } as Partial<Message>;

        expect(hasFlag(MESSAGE_FLAGS.FLAG_SENT)(message)).toBeTrue();
    });

    it('should detect correctly that the message has not a flag', () => {
        const message = {
            Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
        } as Partial<Message>;

        expect(hasFlag(MESSAGE_FLAGS.FLAG_SENT)(message)).toBeFalsy();
    });
});

describe('setFlag', () => {
    it('should set the message Flag', () => {
        const message = {
            Flags: MESSAGE_FLAGS.FLAG_SENT,
        } as Partial<Message>;

        const newFlags = setFlag(MESSAGE_FLAGS.FLAG_RECEIPT_SENT)(message);
        expect(newFlags).toEqual(MESSAGE_FLAGS.FLAG_SENT + MESSAGE_FLAGS.FLAG_RECEIPT_SENT);
    });
});

describe('clearFlag', () => {
    it('should clear the message flag', () => {
        const message = {
            Flags: MESSAGE_FLAGS.FLAG_SENT + MESSAGE_FLAGS.FLAG_RECEIPT_SENT,
        } as Partial<Message>;

        const newFlags = clearFlag(MESSAGE_FLAGS.FLAG_RECEIPT_SENT)(message);
        expect(newFlags).toEqual(MESSAGE_FLAGS.FLAG_SENT);
    });
});

describe('toggleFlag', () => {
    it('should clear the message flag', () => {
        const message = {
            Flags: MESSAGE_FLAGS.FLAG_SENT + MESSAGE_FLAGS.FLAG_RECEIPT_SENT,
        } as Partial<Message>;

        const newFlags = toggleFlag(MESSAGE_FLAGS.FLAG_RECEIPT_SENT)(message);
        expect(newFlags).toEqual(MESSAGE_FLAGS.FLAG_SENT);
    });
});
