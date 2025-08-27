import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label, LabelCount, MailSettings } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import type { SearchParameters } from '@proton/shared/lib/mail/search';

import type { Element } from 'proton-mail/models/element';

import type { Conversation, ConversationLabel } from '../models/conversation';
import {
    filterElementsInState,
    getAddressID,
    getCounterMap,
    getDate,
    getLocationElementsCount,
    isElementConversation,
    isElementMessage,
    isElementOutsideFolders,
    isUnread,
    matchAddressID,
    matchBegin,
    matchEnd,
    matchFrom,
    matchTo,
    sort,
} from './elements';

const senderAddress = 'sender@protonmail.com';
const toAddress = 'recipient@protonmail.com';

const message = {
    ID: 'message1',
    ConversationID: 'conversationID',
    AddressID: 'addressID',
    Sender: {
        Name: 'Sender',
        Address: senderAddress,
    },
    ToList: [
        {
            Name: 'Recipient',
            Address: toAddress,
        },
    ],
    Time: new Date('2018/01/01').getTime(),
    LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
    Unread: 1,
} as Message;

const conversation = {
    ID: 'conversation1',
    Senders: [
        {
            Name: 'Sender',
            Address: senderAddress,
        },
    ],
    Recipients: [
        {
            Name: 'Recipient',
            Address: toAddress,
        },
    ],
    Labels: [
        {
            ID: MAILBOX_LABEL_IDS.INBOX,
            ContextTime: new Date('2018/01/01').getTime(),
            ContextNumMessages: 2,
            ContextNumUnread: 2,
        },
    ],
} as Conversation;

describe('elements', () => {
    describe('isConversation / isMessage', () => {
        it('should return conversation when there is no conversationID in message', () => {
            const element: Conversation = { ID: 'conversationID' };
            expect(isElementConversation(element)).toBe(true);
            expect(isElementMessage(element)).toBe(false);
        });

        it('should return message when there is a conversationID in message', () => {
            const element = { ConversationID: 'something' } as Message;
            expect(isElementConversation(element)).toBe(false);
            expect(isElementMessage(element)).toBe(true);
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
            const result = getCounterMap(
                [],
                [inboxCount, sentConversationCount],
                [sentMessageCount],
                {} as MailSettings
            );
            expect(result[MAILBOX_LABEL_IDS.INBOX]?.Unread).toBe(inboxCount.Unread);
            expect(result[MAILBOX_LABEL_IDS.SENT]?.Unread).toBe(sentMessageCount.Unread);
            expect(result[MAILBOX_LABEL_IDS.STARRED]).toBeUndefined();
        });
    });

    describe('getAddressID', () => {
        it('should return the addressID of a message', () => {
            expect(getAddressID(message)).toBe('addressID');
        });

        it('should return an empty string for a conversation', () => {
            expect(getAddressID(conversation)).toBe('');
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

    describe('getLocationElementsCount', () => {
        const labelID = 'labelID';

        const messageCounts: LabelCount[] = [
            { LabelID: '0', Unread: 5, Total: 20 },
            { LabelID: labelID, Unread: 2, Total: 10 },
        ];

        const conversationCounts: LabelCount[] = [
            { LabelID: '0', Unread: 2, Total: 10 },
            { LabelID: labelID, Unread: 1, Total: 5 },
        ];

        it('should return the expected count for messages', () => {
            expect(getLocationElementsCount(labelID, conversationCounts, messageCounts, false)).toEqual(10);
        });

        it('should return the expected count for conversations', () => {
            expect(getLocationElementsCount(labelID, conversationCounts, messageCounts, true)).toEqual(5);
        });
    });

    describe('matchFrom', () => {
        it('should match from address', () => {
            const addresses = [senderAddress, 'sender+alias@protonmail.com', 'SENDER@protonmail.COM'];

            addresses.forEach((address) => {
                expect(matchFrom(message, address)).toBeTruthy();
                expect(matchFrom(conversation, address)).toBeTruthy();
            });
        });

        it('should not match from address', () => {
            const addresses = ['sender@otherdomain.com'];

            addresses.forEach((address) => {
                expect(matchFrom(message, address)).toBeFalsy();
                expect(matchFrom(conversation, address)).toBeFalsy();
            });
        });

        it('should match partial email address input', () => {
            const addresses = ['sender@', 'sender'];

            addresses.forEach((address) => {
                expect(matchFrom(message, address)).toBeTruthy();
                expect(matchFrom(conversation, address)).toBeTruthy();
            });
        });

        it('should match alias sender address', () => {
            const addresses = ['sender@', 'sender', 'sender@protonmail.com', 'alias', 'ALIAS'];

            const aliasSenderAddress = 'sender+alias@protonmail.com';

            const messageWithAliasSender = {
                ...message,
                Sender: {
                    Name: 'Sender',
                    Address: aliasSenderAddress,
                },
            } as Message;

            const conversationWithAliasSender = {
                ...conversation,
                Senders: [
                    {
                        Name: 'Sender',
                        Address: aliasSenderAddress,
                    },
                ],
            } as Conversation;

            addresses.forEach((address) => {
                expect(matchFrom(messageWithAliasSender, address)).toBeTruthy();
                expect(matchFrom(conversationWithAliasSender, address)).toBeTruthy();
            });
        });

        it('should match sender name', () => {
            const addresses = ['test', 'TEST'];

            const messageWithNamedSender = {
                ...message,
                Sender: {
                    Name: 'Test',
                    Address: senderAddress,
                },
            } as Message;

            const conversationWithNamedSender = {
                ...conversation,
                Senders: [
                    {
                        Name: 'test',
                        Address: senderAddress,
                    },
                ],
            } as Conversation;

            addresses.forEach((address) => {
                expect(matchFrom(messageWithNamedSender, address)).toBeTruthy();
                expect(matchFrom(conversationWithNamedSender, address)).toBeTruthy();
            });
        });
    });

    describe('matchTo', () => {
        it('should match to address', () => {
            const addresses = [toAddress, 'recipient+alias@protonmail.com', 'RECIPIENT@protonmail.COM'];

            addresses.forEach((address) => {
                expect(matchTo(message, address)).toBeTruthy();
                expect(matchTo(conversation, address)).toBeTruthy();
            });
        });

        it('should not match to address', () => {
            const addresses = ['recipient@otherdomain.com'];

            addresses.forEach((address) => {
                expect(matchTo(message, address)).toBeFalsy();
                expect(matchTo(conversation, address)).toBeFalsy();
            });
        });

        it('should match partial email address input', () => {
            const addresses = ['recipient@', 'recipient'];

            addresses.forEach((address) => {
                expect(matchTo(message, address)).toBeTruthy();
                expect(matchTo(conversation, address)).toBeTruthy();
            });
        });

        it('should match alias recipient address', () => {
            const addresses = ['recipient@', 'recipient', 'recipient@protonmail.com', 'alias', 'ALIAS'];

            const aliasRecipientAddress = 'recipient+alias@protonmail.com';

            const messageWithAliasRecipient = {
                ...message,
                ToList: [
                    {
                        Name: 'Recipient',
                        Address: aliasRecipientAddress,
                    },
                ],
            } as Message;

            const conversationWithAliasRecipient = {
                ...conversation,
                Recipients: [
                    {
                        Name: 'Recipient',
                        Address: aliasRecipientAddress,
                    },
                ],
            } as Conversation;

            addresses.forEach((address) => {
                expect(matchTo(messageWithAliasRecipient, address)).toBeTruthy();
                expect(matchTo(conversationWithAliasRecipient, address)).toBeTruthy();
            });
        });

        it('should match recipient name', () => {
            const addresses = ['test', 'TEST'];

            const messageWithNamedRecipient = {
                ...message,
                ToList: [
                    {
                        Name: 'Test',
                        Address: toAddress,
                    },
                ],
            } as Message;

            const conversationWithNamedRecipient = {
                ...conversation,
                Recipients: [
                    {
                        Name: 'test',
                        Address: toAddress,
                    },
                ],
            } as Conversation;

            addresses.forEach((address) => {
                expect(matchTo(messageWithNamedRecipient, address)).toBeTruthy();
                expect(matchTo(conversationWithNamedRecipient, address)).toBeTruthy();
            });
        });
    });

    describe('matchBegin', () => {
        it('should match begin', () => {
            const date = new Date('2017/12/31').getTime();
            expect(matchBegin(conversation, MAILBOX_LABEL_IDS.INBOX, date)).toBeTruthy();
        });

        it('should not match begin', () => {
            const date = new Date('2020/01/01').getTime();
            expect(matchBegin(conversation, MAILBOX_LABEL_IDS.INBOX, date)).toBeFalsy();
        });
    });

    describe('matchEnd', () => {
        it('should match end', () => {
            const date = new Date('2020/01/01').getTime();
            expect(matchEnd(conversation, MAILBOX_LABEL_IDS.INBOX, date)).toBeTruthy();
        });

        it('should not match end', () => {
            const date = new Date('2017/12/31').getTime();
            expect(matchEnd(conversation, MAILBOX_LABEL_IDS.INBOX, date)).toBeFalsy();
        });
    });

    describe('matchAddressID', () => {
        it('should match address', () => {
            expect(matchAddressID(message, 'addressID')).toBeTruthy();
            expect(matchAddressID(conversation, '')).toBeTruthy();
        });

        it('should not match address', () => {
            expect(matchAddressID(message, 'otherAddressID')).toBeFalsy();
            expect(matchAddressID(conversation, 'otherAddressID')).toBeFalsy();
        });
    });

    describe('filterElementsInState', () => {
        it('should return the expected element list', () => {
            /* Filter all elements that:
             * - Are in inbox
             * - Are unread OR bypass unread filter
             * - Are messages
             * - match from address
             * - match to address
             * - match begin
             * - match end
             */

            const messageBypassFilter = {
                ID: 'message2',
                ConversationID: 'conversationID2',
                Sender: {
                    Name: 'Sender',
                    Address: senderAddress,
                },
                ToList: [
                    {
                        Name: 'Recipient',
                        Address: toAddress,
                    },
                ],
                Time: new Date('2018/01/01').getTime(),
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                Unread: 0,
            } as Message;

            const messageInOtherLabel = {
                ID: 'message3',
                ConversationID: 'conversationID3',
                Sender: {
                    Name: 'Sender',
                    Address: senderAddress,
                },
                ToList: [
                    {
                        Name: 'Recipient',
                        Address: toAddress,
                    },
                ],
                Time: new Date('2018/01/01').getTime(),
                LabelIDs: [MAILBOX_LABEL_IDS.TRASH],
                Unread: 1,
            } as Message;

            const messageRead = {
                ID: 'message4',
                ConversationID: 'conversationID4',
                Sender: {
                    Name: 'Sender',
                    Address: senderAddress,
                },
                ToList: [
                    {
                        Name: 'Recipient',
                        Address: toAddress,
                    },
                ],
                Time: new Date('2018/01/01').getTime(),
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                Unread: 0,
            } as Message;

            const messageWrongSender = {
                ID: 'message5',
                ConversationID: 'conversationID5',
                Sender: {
                    Name: 'Sender2',
                    Address: 'someone@protonmail.com',
                },
                ToList: [
                    {
                        Name: 'Recipient',
                        Address: toAddress,
                    },
                ],
                Time: new Date('2018/01/01').getTime(),
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                Unread: 1,
            } as Message;

            const messageWrongRecipient = {
                ID: 'message6',
                ConversationID: 'conversationID6',
                Sender: {
                    Name: 'Sender',
                    Address: senderAddress,
                },
                ToList: [
                    {
                        Name: 'Recipient2',
                        Address: 'someone@protonmail.com',
                    },
                ],
                Time: new Date('2018/01/01').getTime(),
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                Unread: 1,
            } as Message;

            const messageTooOld = {
                ID: 'message7',
                ConversationID: 'conversationID7',
                Sender: {
                    Name: 'Sender',
                    Address: senderAddress,
                },
                ToList: [
                    {
                        Name: 'Recipient',
                        Address: toAddress,
                    },
                ],
                Time: new Date('2016/01/01').getTime(),
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                Unread: 1,
            } as Message;

            const messageTooRecent = {
                ID: 'message8',
                ConversationID: 'conversationID8',
                Sender: {
                    Name: 'Sender',
                    Address: senderAddress,
                },
                ToList: [
                    {
                        Name: 'Recipient',
                        Address: toAddress,
                    },
                ],
                Time: new Date('2025/01/01').getTime(),
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                Unread: 1,
            } as Message;

            const elements: Element[] = [
                message,
                conversation,
                messageBypassFilter,
                messageInOtherLabel,
                messageRead,
                messageWrongSender,
                messageWrongRecipient,
                messageTooOld,
                messageTooRecent,
            ];

            const expectedFilteredList = [message, messageBypassFilter];

            expect(
                filterElementsInState({
                    elements,
                    bypassFilter: [messageBypassFilter.ID],
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: { Unread: 1 },
                    conversationMode: false,
                    search: {
                        from: senderAddress,
                        to: toAddress,
                        begin: new Date('2017/12/31').getTime(),
                        end: new Date('2019/01/01').getTime(),
                    } as SearchParameters,
                })
            ).toEqual(expectedFilteredList);
        });
    });

    describe('isElementOutsideFolders', () => {
        const labels = [
            { ID: 'custom-label-1', Name: 'Custom1' } as Label,
            { ID: 'custom-label-2', Name: 'Custom2' } as Label,
        ];

        it('should be true when element is in all mail only', () => {
            const message = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.ALL_MAIL],
            } as Message;

            const conversation = {
                Labels: [{ ID: MAILBOX_LABEL_IDS.ALL_MAIL } as ConversationLabel],
            } as Conversation;

            expect(isElementOutsideFolders(message, labels)).toBeTruthy();
            expect(isElementOutsideFolders(conversation, labels)).toBeTruthy();
        });

        it('should be true when element is in all mail and almost all mail', () => {
            const message = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            } as Message;

            const conversation = {
                Labels: [
                    { ID: MAILBOX_LABEL_IDS.ALL_MAIL } as ConversationLabel,
                    { ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL } as ConversationLabel,
                ],
            } as Conversation;

            expect(isElementOutsideFolders(message, labels)).toBeTruthy();
            expect(isElementOutsideFolders(conversation, labels)).toBeTruthy();
        });

        it('should be true when element is in ll mail, almost all mail and a custom label', () => {
            const message = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, 'custom-label-1'],
            } as Message;

            const conversation = {
                Labels: [
                    { ID: MAILBOX_LABEL_IDS.ALL_MAIL } as ConversationLabel,
                    { ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL } as ConversationLabel,
                    { ID: 'custom-label-1' } as ConversationLabel,
                ],
            } as Conversation;

            expect(isElementOutsideFolders(message, labels)).toBeTruthy();
            expect(isElementOutsideFolders(conversation, labels)).toBeTruthy();
        });

        it('should be true when element is in ll mail, almost all mail and a Starred', () => {
            const message = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.STARRED],
            } as Message;

            const conversation = {
                Labels: [
                    { ID: MAILBOX_LABEL_IDS.ALL_MAIL } as ConversationLabel,
                    { ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL } as ConversationLabel,
                    { ID: MAILBOX_LABEL_IDS.STARRED } as ConversationLabel,
                ],
            } as Conversation;

            expect(isElementOutsideFolders(message, labels)).toBeTruthy();
            expect(isElementOutsideFolders(conversation, labels)).toBeTruthy();
        });

        it('should be false when element is not only in all mail and almost all mail', () => {
            const message = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.INBOX],
            } as Message;

            const conversation = {
                Labels: [
                    { ID: MAILBOX_LABEL_IDS.ALL_MAIL } as ConversationLabel,
                    { ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL } as ConversationLabel,
                    { ID: MAILBOX_LABEL_IDS.INBOX } as ConversationLabel,
                ],
            } as Conversation;

            expect(isElementOutsideFolders(message, labels)).toBeFalsy();
            expect(isElementOutsideFolders(conversation, labels)).toBeFalsy();
        });
    });
});
