import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { INCOMING_DEFAULTS_LOCATION } from '@proton/shared/lib/constants';
import type { Address, IncomingDefault, SimpleMap } from '@proton/shared/lib/interfaces';
import type { Recipient } from '@proton/shared/lib/interfaces/Address';
import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';

import { fromFields, recipients } from 'proton-mail/components/composer/tests/Composer.test.data';

import type { Conversation } from '../../models/conversation';
import type { Element } from '../../models/element';
import {
    findSender,
    getNumParticipants,
    getRecipientGroupLabel,
    getRecipientLabel,
    getRecipients,
    getReplyRecipientListAsString,
    getSendersToBlock,
    recipientsToRecipientOrGroup,
} from './messageRecipients';

const recipient1: Recipient = { Name: '', Address: 'address1' };
const recipient2: Recipient = { Name: 'recipient2', Address: 'address2' };
const recipient3: Recipient = { Name: 'recipient3', Address: 'address3', Group: 'Group1' };
const recipient4: Recipient = { Name: 'recipient4', Address: 'address4', Group: 'Group1' };
const recipient5: Recipient = { Name: 'recipient5', Address: 'address5', Group: 'Group2' };
const group1 = { ID: 'GroupID1', Name: 'GroupName1', Path: 'Group1' } as ContactGroup;
const groupMap = { [group1.Path]: group1 };

describe('messageRecipients', () => {
    describe('findSender', () => {
        it('should return empty for no message no addresses', () => {
            const result = findSender();
            expect(result).toBe(undefined);
        });

        it('should return empty for no addresses', () => {
            const result = findSender([], { AddressID: '1' } as Message);
            expect(result).toBe(undefined);
        });

        it('should return empty if no match', () => {
            const result = findSender([{ Status: 2 }] as Address[], { AddressID: '1' } as Message);
            expect(result).toBe(undefined);
        });

        it('should return first if addresses valid but no match', () => {
            const first = { Status: 1, Order: 1, ID: '2' };
            const result = findSender(
                [{ Status: 2 }, first, { Status: 1, Order: 2, ID: '3' }] as Address[],
                {
                    AddressID: '1',
                } as Message
            );
            expect(result).toBe(first);
        });

        it('should return first if addresses order valid but no match', () => {
            const first = { Status: 1, Order: 1, ID: '2' };
            const result = findSender(
                [{ Status: 2, Order: 0, ID: '1' }, first, { Status: 1, Order: 2, ID: '3' }] as Address[],
                {
                    AddressID: '1',
                } as Message
            );
            expect(result).toEqual(first);
        });

        it('should return the match over order', () => {
            const match = { Status: 1, Order: 2, ID: '1' };
            const result = findSender(
                [{ Status: 2 }, match, { Status: 1, Order: 1, ID: '2' }] as Address[],
                {
                    AddressID: '1',
                } as Message
            );
            expect(result).toBe(match);
        });
    });

    describe('recipientsToRecipientOrGroup', () => {
        it('should return recipients if no group', () => {
            const result = recipientsToRecipientOrGroup([recipient1, recipient2], {});
            expect(result).toEqual([{ recipient: recipient1 }, { recipient: recipient2 }]);
        });

        it('should merge recipients from a group', () => {
            const result = recipientsToRecipientOrGroup([recipient3, recipient4], groupMap);
            expect(result).toEqual([{ group: { group: group1, recipients: [recipient3, recipient4] } }]);
        });

        it('should split recipients from group and those not', () => {
            const result = recipientsToRecipientOrGroup([recipient2, recipient3], groupMap);
            expect(result).toEqual([{ recipient: recipient2 }, { group: { group: group1, recipients: [recipient3] } }]);
        });

        it('should give up group from recipient if not in group list', () => {
            const result = recipientsToRecipientOrGroup([recipient5], groupMap);
            expect(result).toEqual([{ recipient: recipient5 }]);
        });

        it('should return recipients if we do not want to display groups', () => {
            const result = recipientsToRecipientOrGroup([recipient3, recipient4, recipient5], groupMap, true);
            expect(result).toEqual([{ recipient: recipient3 }, { recipient: recipient4 }, { recipient: recipient5 }]);
        });
    });

    describe('getRecipientOrGroupLabel', () => {
        it('should return recipient address if it has no name', () => {
            const result = getRecipientLabel(recipient1, {});
            expect(result).toEqual('address1');
        });

        it('should return recipient name if it exists', () => {
            const result = getRecipientLabel(recipient2, {});
            expect(result).toEqual('recipient2');
        });

        it('should return group label', () => {
            const result = getRecipientGroupLabel({ group: group1, recipients: [] }, 0);
            expect(result).toEqual('GroupName1 (0/0 members)');
        });

        it('should compute group size with contact list', () => {
            const result = getRecipientGroupLabel({ group: group1, recipients: [recipient3, recipient4] }, 8);
            expect(result).toEqual('GroupName1 (2/8 members)');
        });
    });

    describe('getNumParticipants', () => {
        it('should not count same participant', () => {
            const sender: Recipient = { Name: 'Panda', Address: 'panda@pm.me' };
            const recipient1: Recipient = { Name: 'Panda', Address: 'panda@pm.me' };
            const recipient2: Recipient = { Name: 'Panda', Address: 'p.an.da@pm.me' };
            const recipient3: Recipient = { Name: 'Panda', Address: 'panda+panda@pm.me' };
            const conversation: Element = {
                ID: 'conversationID',
                Senders: [sender],
                Recipients: [recipient1, recipient2, recipient3],
            };
            const result = getNumParticipants(conversation);
            expect(result).toEqual(1);
        });
    });

    describe('getSendersToBlock', () => {
        // Message not present in SPAM or ALLOW or BLOCK list
        const toCreate = 'toCreate@protonmail.com';
        // Message from someone already in the SPAM list
        const toUpdateSpam = 'toUpdateSpam@protonmail.com';
        // Message from someone already in the ALLOW list
        const toUpdateInbox = 'toUpdateInbox@protonmail.com';
        // Message from someone already in the BLOCK list
        const alreadyBlocked = 'alreadyBlocked@protonmail.com';
        // Message sent to myself
        const me = 'me@protonmail.com';
        // Message sent to myself from secondary address
        const me2 = 'me2@protonmail.com';

        const incomingDefaultsAddresses = [
            { ID: '1', Email: toUpdateInbox, Location: INCOMING_DEFAULTS_LOCATION.INBOX } as IncomingDefault,
            { ID: '2', Email: toUpdateSpam, Location: INCOMING_DEFAULTS_LOCATION.SPAM } as IncomingDefault,
            { ID: '3', Email: alreadyBlocked, Location: INCOMING_DEFAULTS_LOCATION.BLOCKED } as IncomingDefault,
        ] as IncomingDefault[];

        const addresses = [{ Email: me } as Address, { Email: me2 } as Address] as Address[];

        const expectedSenders = [
            { Address: toCreate } as Recipient,
            { Address: toUpdateSpam } as Recipient,
            { Address: toUpdateInbox } as Recipient,
        ];

        it('should return expected senders to block from messages', () => {
            const elements = [
                { Sender: { Address: toCreate } as Recipient, ConversationID: '1' } as Message,
                { Sender: { Address: toUpdateSpam } as Recipient, ConversationID: '2' } as Message,
                { Sender: { Address: toUpdateInbox } as Recipient, ConversationID: '3' } as Message,
                // Put one 2 times to check that it will not be called 2 times
                { Sender: { Address: toUpdateInbox } as Recipient, ConversationID: '4' } as Message,
                { Sender: { Address: alreadyBlocked } as Recipient, ConversationID: '5' } as Message,
                { Sender: { Address: me } as Recipient, ConversationID: '6' } as Message,
                { Sender: { Address: me2 } as Recipient, ConversationID: '7' } as Message,
            ] as Element[];

            const senders = getSendersToBlock(elements, incomingDefaultsAddresses, addresses);

            expect(senders).toEqual(expectedSenders);
        });

        it('should return expected senders to block from conversation', () => {
            const elements = [
                { Senders: [{ Address: toCreate } as Recipient] } as Conversation,
                { Senders: [{ Address: toUpdateSpam } as Recipient] } as Conversation,
                { Senders: [{ Address: toUpdateInbox } as Recipient] } as Conversation,
                // Put one 2 times to check that it will not be called 2 times
                { Senders: [{ Address: toUpdateInbox } as Recipient] } as Conversation,
                { Senders: [{ Address: alreadyBlocked } as Recipient] } as Conversation,
                { Senders: [{ Address: me } as Recipient] } as Conversation,
                { Senders: [{ Address: me2 } as Recipient] } as Conversation,
            ] as Element[];

            const senders = getSendersToBlock(elements, incomingDefaultsAddresses, addresses);

            expect(senders).toEqual(expectedSenders);
        });
    });

    describe('getRecipients', () => {
        it.each`
            replyType                    | isSentMessage
            ${MESSAGE_ACTIONS.REPLY}     | ${true}
            ${MESSAGE_ACTIONS.REPLY}     | ${false}
            ${MESSAGE_ACTIONS.REPLY_ALL} | ${true}
            ${MESSAGE_ACTIONS.REPLY_ALL} | ${false}
        `('should give the expected recipients', ({ replyType, isSentMessage }) => {
            const referenceMessage = {
                data: {
                    ReplyTos: isSentMessage ? [recipients.meRecipient] : [recipients.fromRecipient],
                    ToList: isSentMessage ? [recipients.toRecipient] : [recipients.meRecipient, recipients.toRecipient],
                    CCList: [recipients.ccRecipient],
                    BCCList: [recipients.bccRecipient],
                    Flags: isSentMessage ? MESSAGE_FLAGS.FLAG_SENT : MESSAGE_FLAGS.FLAG_RECEIVED,
                } as Partial<Message>,
            } as MessageState;

            const addresses = [{ DisplayName: fromFields.meName, Email: fromFields.meAddress } as Address];

            const { ToList, CCList, BCCList } = getRecipients(referenceMessage, replyType, addresses);

            if (replyType === MESSAGE_ACTIONS.REPLY) {
                if (isSentMessage) {
                    expect(ToList).toEqual([recipients.toRecipient]);
                    expect(CCList).toEqual([]);
                    expect(BCCList).toEqual([]);
                } else {
                    expect(ToList).toEqual([recipients.fromRecipient]);
                    expect(CCList).toEqual([]);
                    expect(BCCList).toEqual([]);
                }
            } else {
                if (isSentMessage) {
                    expect(ToList).toEqual([recipients.toRecipient]);
                    expect(CCList).toEqual([recipients.ccRecipient]);
                    expect(BCCList).toEqual([recipients.bccRecipient]);
                } else {
                    expect(ToList).toEqual([recipients.fromRecipient]);
                    expect(CCList).toEqual([recipients.toRecipient, recipients.ccRecipient]);
                    expect(BCCList).toEqual([]);
                }
            }
        });
    });

    describe('getReplyRecipientListAsString', () => {
        it.each`
            replyType                    | isSentMessage
            ${MESSAGE_ACTIONS.REPLY}     | ${true}
            ${MESSAGE_ACTIONS.REPLY}     | ${false}
            ${MESSAGE_ACTIONS.REPLY_ALL} | ${true}
            ${MESSAGE_ACTIONS.REPLY_ALL} | ${false}
        `('should give the expected recipient string', ({ replyType, isSentMessage }) => {
            const referenceMessage = {
                data: {
                    ReplyTos: isSentMessage ? [recipients.meRecipient] : [recipients.fromRecipient],
                    ToList: isSentMessage ? [recipients.toRecipient] : [recipients.meRecipient, recipients.toRecipient],
                    CCList: [recipients.ccRecipient],
                    BCCList: [recipients.bccRecipient],
                    Flags: isSentMessage ? MESSAGE_FLAGS.FLAG_SENT : MESSAGE_FLAGS.FLAG_RECEIVED,
                } as Partial<Message>,
            } as MessageState;

            const addresses = [{ DisplayName: fromFields.meName, Email: fromFields.meAddress } as Address];
            const fromCustomName = 'From contact name';
            const contactsMap: SimpleMap<ContactEmail> = {
                'from@protonmail.com': {
                    Email: fromFields.fromAddress,
                    Name: fromCustomName,
                } as ContactEmail,
            };

            const recipientsString = getReplyRecipientListAsString(referenceMessage, replyType, addresses, contactsMap);

            if (replyType === MESSAGE_ACTIONS.REPLY) {
                if (isSentMessage) {
                    expect(recipientsString).toEqual('To');
                } else {
                    expect(recipientsString).toEqual(`${fromCustomName}`);
                }
            } else {
                if (isSentMessage) {
                    expect(recipientsString).toEqual('To, CC, BCC');
                } else {
                    expect(recipientsString).toEqual(`${fromCustomName}, To, CC`);
                }
            }
        });
    });
});
