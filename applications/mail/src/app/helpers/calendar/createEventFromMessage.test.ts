import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { getCreateEventFromMessagePayload, getSenderFromMessage } from './createEventFromMessage';

const buildMessage = (overrides: Partial<Message> = {}) =>
    ({
        ID: 'message-123',
        Subject: 'Project review',
        Sender: { Address: 'jane@example.com', Name: 'Jane Smith' },
        ...overrides,
    }) as Message;

describe('createEventFromMessage', () => {
    describe('getSenderFromMessage', () => {
        it('uses the sender name when available', () => {
            expect(getSenderFromMessage(buildMessage())).toEqual('Jane Smith');
        });

        it('falls back to the address when the name is empty', () => {
            expect(getSenderFromMessage(buildMessage({ Sender: { Address: 'jane@example.com', Name: '' } }))).toEqual(
                'jane@example.com'
            );
        });

        it('returns undefined when there is no sender address', () => {
            expect(getSenderFromMessage(buildMessage({ Sender: { Address: '' } }))).toBeUndefined();
            expect(getSenderFromMessage(undefined)).toBeUndefined();
        });
    });

    describe('getCreateEventFromMessagePayload', () => {
        it('forwards only messageID, subject and sender, never the body', () => {
            const payload = getCreateEventFromMessagePayload(buildMessage({ Body: 'super secret body' }), 84000);

            expect(payload).toEqual({
                messageID: 'message-123',
                subject: 'Project review',
                sender: 'Jane Smith',
                start: 84000,
            });
            expect(payload).not.toHaveProperty('body');
            expect(payload).not.toHaveProperty('Body');
        });

        it('omits `start` for the menu action (undefined start)', () => {
            const payload = getCreateEventFromMessagePayload(buildMessage());

            expect(payload?.start).toBeUndefined();
        });

        it('normalises a missing subject to an empty string', () => {
            const payload = getCreateEventFromMessagePayload(buildMessage({ Subject: '' }));

            expect(payload?.subject).toEqual('');
        });

        it('returns undefined when the message is undefined', () => {
            expect(getCreateEventFromMessagePayload(undefined)).toBeUndefined();
        });
    });
});
