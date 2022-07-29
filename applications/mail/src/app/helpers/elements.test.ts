import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { Conversation, ConversationLabel } from '../models/conversation';
import { getCounterMap, getDate, isConversation, isMessage, isUnread, sort } from './elements';

describe('elements', () => {
    describe('isConversation / isMessage', () => {
        it('should return conversation when there is no conversationID in message', () => {
            const element: Conversation = { ID: 'conversationID' };
            expect(isConversation(element)).toBe(true);
            expect(isMessage(element)).toBe(false);
        });

        it('should return message when there is a conversationID in message', () => {
            const element = { ConversationID: 'something' } as Message;
            expect(isConversation(element)).toBe(false);
            expect(isMessage(element)).toBe(true);
        });
    });

    describe('sort', () => {
        it('should sort by time', () => {
            const elements = [
                { Time: 1, ID: '1' },
                { Time: 2, ID: '2' },
                { Time: 3, ID: '3' },
            ];
            expect(sort(elements, { sort: 'Time', desc: false }, 'labelID')).toEqual(elements);
        });
        it('should sort by time desc', () => {
            const elements = [
                { Time: 1, ID: '1' },
                { Time: 2, ID: '2' },
                { Time: 3, ID: '3' },
            ];
            expect(sort(elements, { sort: 'Time', desc: true }, 'labelID')).toEqual([...elements].reverse());
        });
        it('should fallback on order', () => {
            const elements = [
                { ID: '1', Time: 1, Order: 3 },
                { ID: '2', Time: 1, Order: 2 },
                { ID: '3', Time: 1, Order: 1 },
            ];
            expect(sort(elements, { sort: 'Time', desc: true }, 'labelID')).toEqual([...elements]);
        });
        it('should sort by order reversed for time asc', () => {
            const elements = [
                { ID: '1', Time: 1, Order: 3 },
                { ID: '2', Time: 1, Order: 2 },
                { ID: '3', Time: 1, Order: 1 },
            ];
            expect(sort(elements, { sort: 'Time', desc: false }, 'labelID')).toEqual([...elements].reverse());
        });
        it('should sort by size', () => {
            const elements = [
                { ID: '1', Size: 1 },
                { ID: '2', Size: 2 },
                { ID: '3', Size: 3 },
            ];
            expect(sort(elements, { sort: 'Size', desc: false }, 'labelID')).toEqual(elements);
        });
    });

    describe('getCounterMap', () => {
        it('should use conversation or message count depending the label type', () => {
            const inboxCount = { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 5 };
            const sentConversationCount = { LabelID: MAILBOX_LABEL_IDS.SENT, Unread: 5 };
            const sentMessageCount = { LabelID: MAILBOX_LABEL_IDS.SENT, Unread: 10 };
            const loc = { pathname: '', search: '', state: {}, hash: '' };
            const result = getCounterMap(
                [],
                [inboxCount, sentConversationCount],
                [sentMessageCount],
                {} as MailSettings,
                loc
            );
            expect(result[MAILBOX_LABEL_IDS.INBOX]?.Unread).toBe(inboxCount.Unread);
            expect(result[MAILBOX_LABEL_IDS.SENT]?.Unread).toBe(sentMessageCount.Unread);
            expect(result[MAILBOX_LABEL_IDS.STARRED]).toBeUndefined();
        });
    });

    describe('getDate', () => {
        const Time = 42;
        const WrongTime = 43;
        const expected = new Date(Time * 1000);

        it('should not fail for an undefined element', () => {
            expect(getDate(undefined, '') instanceof Date).toBe(true);
        });

        it('should take the Time property of a message', () => {
            const message = { ConversationID: '', Time } as Message;
            expect(getDate(message, '')).toEqual(expected);
        });

        it('should take the right label ContextTime of a conversation', () => {
            const LabelID = 'LabelID';
            const conversation = {
                ID: 'conversationID',
                Labels: [
                    { ID: 'something', ContextTime: WrongTime } as ConversationLabel,
                    { ID: LabelID, ContextTime: Time } as ConversationLabel,
                ],
            };
            expect(getDate(conversation, LabelID)).toEqual(expected);
        });

        it('should take the Time property of a conversation', () => {
            const conversation = { Time, ID: 'conversationID' };
            expect(getDate(conversation, '')).toEqual(expected);
        });

        it('should take the label time in priority for a conversation', () => {
            const LabelID = 'LabelID';
            const conversation = {
                ID: 'conversationID',
                Time: WrongTime,
                Labels: [{ ID: LabelID, ContextTime: Time } as ConversationLabel],
            };
            expect(getDate(conversation, LabelID)).toEqual(expected);
        });
    });

    describe('isUnread', () => {
        it('should not fail for an undefined element', () => {
            expect(isUnread(undefined, '')).toBe(false);
        });

        it('should take the Unread property of a message', () => {
            const message = { ConversationID: '', Unread: 0 } as Message;
            expect(isUnread(message, '')).toBe(false);
        });

        it('should take the right label ContextNumUnread of a conversation', () => {
            const LabelID = 'LabelID';
            const conversation = {
                ID: 'conversationID',
                Labels: [
                    { ID: 'something', ContextNumUnread: 1 } as ConversationLabel,
                    { ID: LabelID, ContextNumUnread: 0 } as ConversationLabel,
                ],
            };
            expect(isUnread(conversation, LabelID)).toBe(false);
        });

        it('should take the ContextNumUnread property of a conversation', () => {
            const conversation = { ContextNumUnread: 0, ID: 'conversationID' };
            expect(isUnread(conversation, '')).toBe(false);
        });

        it('should take the NumUnread property of a conversation', () => {
            const conversation = { NumUnread: 0, ID: 'conversationID' };
            expect(isUnread(conversation, '')).toBe(false);
        });

        it('should take the value when all are present for a conversation', () => {
            const LabelID = 'LabelID';
            const conversation = {
                ID: 'conversationID',
                ContextNumUnread: 1,
                NumUnread: 1,
                Labels: [{ ID: LabelID, ContextNumUnread: 0 } as ConversationLabel],
            };
            expect(isUnread(conversation, LabelID)).toBe(false);
        });
    });
});
