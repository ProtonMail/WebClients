import { addPlusAlias } from '@proton/shared/lib/helpers/email';
import { Address, MailSettings, Recipient, UserSettings } from '@proton/shared/lib/interfaces';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import {
    FORWARDED_MESSAGE,
    FW_PREFIX,
    ORIGINAL_MESSAGE,
    RE_PREFIX,
    formatSubject,
} from '@proton/shared/lib/mail/messages';

import { MESSAGE_ACTIONS } from '../../constants';
import { MessageState, MessageStateWithData } from '../../logic/messages/messagesTypes';
import { formatFullDate } from '../date';
import {
    createNewDraft,
    generatePreviousMessageInfos,
    getBlockquoteRecipientsString,
    handleActions,
} from './messageDraft';

const ID = 'ID';
const Time = 0;
const Subject = 'test';
const addressID = 'addressID';
const recipient1 = { Address: 'test1@proton.me' };
const recipient2 = { Address: 'test2@proton.me' };
const recipient3 = { Address: 'test3@proton.me' };
const recipient4 = { Address: 'test4@proton.me' };
const recipient5 = { Address: 'test5@proton.me' };

const message = {
    ID,
    Time,
    Subject,
    ToList: [recipient1],
    CCList: [recipient2],
    BCCList: [recipient3],
    ReplyTos: [recipient4],
};

const allActions = [MESSAGE_ACTIONS.NEW, MESSAGE_ACTIONS.REPLY, MESSAGE_ACTIONS.REPLY_ALL, MESSAGE_ACTIONS.FORWARD];
const notNewActions = [MESSAGE_ACTIONS.REPLY, MESSAGE_ACTIONS.REPLY_ALL, MESSAGE_ACTIONS.FORWARD];
const action = MESSAGE_ACTIONS.NEW;
const mailSettings = {} as MailSettings;
const userSettings = {} as UserSettings;
const address = {
    ID: 'addressid',
    DisplayName: 'name',
    Email: 'email',
    Status: 1,
    Receive: 1,
    Send: 1,
    Signature: 'signature',
} as Address;
const addresses: Address[] = [address];

describe('messageDraft', () => {
    describe('formatSubject', () => {
        const listRe = ['Subject', 'Re: Subject', 'Fw: Subject', 'Fw: Re: Subject', 'Re: Fw: Subject'];

        const listFw = ['Subject', 'Re: Subject', 'Fw: Subject', 'Fw: Re: Subject', 'Re: Fw: Subject'];

        it('should add the RE only if id does not start with it', () => {
            const [subject, reply, forward, fwreply, reforward] = listRe;
            expect(formatSubject(subject, RE_PREFIX)).toBe(`${RE_PREFIX} ${subject}`);
            expect(formatSubject(reply, RE_PREFIX)).toBe(reply);
            expect(formatSubject(forward, RE_PREFIX)).toBe(`${RE_PREFIX} ${forward}`);
            expect(formatSubject(fwreply, RE_PREFIX)).toBe(`${RE_PREFIX} ${fwreply}`);
            expect(formatSubject(reforward, RE_PREFIX)).toBe(reforward);
        });

        it('should add the Fw only if id does not start with it', () => {
            const [subject, reply, forward, fwreply, reforward] = listFw;
            expect(formatSubject(subject, FW_PREFIX)).toBe(`${FW_PREFIX} ${subject}`);
            expect(formatSubject(reply, FW_PREFIX)).toBe(`${FW_PREFIX} ${reply}`);
            expect(formatSubject(forward, FW_PREFIX)).toBe(forward);
            expect(formatSubject(fwreply, FW_PREFIX)).toBe(fwreply);
            expect(formatSubject(reforward, FW_PREFIX)).toBe(`${FW_PREFIX} ${reforward}`);
        });
    });

    describe('handleActions', () => {
        it('should return empty values on copy empty input', () => {
            const result = handleActions(MESSAGE_ACTIONS.NEW);
            expect(result.data?.Subject).toEqual('');
            expect(result.data?.ToList).toEqual([]);
            expect(result.data?.CCList).toEqual([]);
            expect(result.data?.BCCList).toEqual([]);
        });

        it('should copy values', () => {
            const result = handleActions(MESSAGE_ACTIONS.NEW, {
                data: {
                    Subject,
                    ToList: [recipient1],
                    CCList: [recipient2],
                    BCCList: [recipient3],
                },
            } as MessageStateWithData);
            expect(result.data?.Subject).toEqual(Subject);
            expect(result.data?.ToList).toEqual([recipient1]);
            expect(result.data?.CCList).toEqual([recipient2]);
            expect(result.data?.BCCList).toEqual([recipient3]);
        });

        it('should prepare a reply for received message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
                },
            } as MessageStateWithData);

            expect(result.data?.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([recipient4]);
        });

        it('should prepare a reply for sent message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_SENT,
                },
            } as MessageStateWithData);

            expect(result.data?.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([recipient1]);
        });

        it('should prepare a reply for received and sent message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_SENT | MESSAGE_FLAGS.FLAG_RECEIVED,
                },
            } as MessageStateWithData);

            expect(result.data?.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([recipient1]);
        });

        it('should prepare a reply all for received message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY_ALL, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
                },
            } as MessageStateWithData);

            expect(result.data?.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([recipient4]);
            expect(result.data?.CCList).toEqual([recipient1, recipient2]);
            expect(result.data?.BCCList).toEqual(undefined);
        });

        it('should prepare a reply all for sent message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY_ALL, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_SENT,
                },
            } as MessageStateWithData);

            expect(result.data?.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([recipient1]);
            expect(result.data?.CCList).toEqual([recipient2]);
            expect(result.data?.BCCList).toEqual([recipient3]);
        });

        it('should prepare a reply all for received and sent message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY_ALL, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_SENT | MESSAGE_FLAGS.FLAG_RECEIVED,
                },
            } as MessageStateWithData);

            expect(result.data?.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([recipient1]);
            expect(result.data?.CCList).toEqual([recipient2]);
            expect(result.data?.BCCList).toEqual([recipient3]);
        });

        it('should keep other user addresses in the CC list on reply all', () => {
            // The email is received on recipient1 (addressID) and recipient5 is another userAddress on which we received the email
            // When we reply to this message, recipient1 must be removed from CCList, and recipient5 must be present

            const message = {
                ID,
                Time,
                Subject,
                ToList: [recipient1, recipient5],
                CCList: [recipient2],
                BCCList: [recipient3],
                ReplyTos: [recipient4],
                AddressID: addressID,
            };

            const result = handleActions(
                MESSAGE_ACTIONS.REPLY_ALL,
                {
                    data: {
                        ...message,
                        Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
                    },
                } as MessageStateWithData,
                [
                    { ID: addressID, Email: recipient1.Address } as Address,
                    { ID: 'otherID', Email: recipient5.Address } as Address,
                ] as Address[]
            );

            expect(result.data?.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([recipient4]);
            expect(result.data?.CCList).toEqual([recipient5, recipient2]);
            expect(result.data?.BCCList).toEqual(undefined);
        });

        it('should prepare recipient list correctly on reply all to alias addresses', () => {
            const recipient1Alias = { Address: addPlusAlias(recipient1.Address, 'alias') };
            const recipient2Alias = { Address: 'test2.2@proton.me' };
            const recipient3Alias = { Address: addPlusAlias(recipient3.Address, 'alias') };
            const recipient4Alias = { Address: 'test4.4@proton.me' };

            const message = {
                ID,
                Time,
                Subject,
                ToList: [recipient1Alias],
                CCList: [recipient2Alias],
                BCCList: [recipient3Alias],
                ReplyTos: [recipient4Alias],
                AddressID: addressID,
            };

            const result = handleActions(
                MESSAGE_ACTIONS.REPLY_ALL,
                {
                    data: {
                        ...message,
                        Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
                    },
                } as MessageStateWithData,
                [{ ID: addressID, Email: recipient1.Address } as Address] as Address[]
            );

            expect(result.data?.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([recipient4Alias]);
            expect(result.data?.CCList).toEqual([recipient2Alias]);
            expect(result.data?.BCCList).toEqual(undefined);
        });

        it('should prepare a forward', () => {
            const result = handleActions(MESSAGE_ACTIONS.FORWARD, { data: message } as MessageStateWithData);

            expect(result.data?.Subject).toEqual(`${FW_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([]);
            expect(result.data?.CCList).toEqual(undefined);
            expect(result.data?.BCCList).toEqual(undefined);
        });
    });

    describe('createNewDraft', () => {
        it('should use insertSignature', () => {
            const result = createNewDraft(
                action,
                { data: message } as MessageStateWithData,
                mailSettings,
                userSettings,
                addresses,
                jest.fn()
            );
            expect(result.messageDocument?.document?.innerHTML).toContain(address.Signature);
        });

        // TODO: Feature to implement
        // it('should parse text', () => {
        //     expect(textToHtmlMail.parse).toHaveBeenCalledTimes(1);
        //     expect(textToHtmlMail.parse).toHaveBeenCalledWith(MESSAGE_BODY_PLAIN);
        // });

        // it('should not parse text', () => {
        //     expect(textToHtmlMail.parse).not.toHaveBeenCalled();
        // });

        it('should load the sender', () => {
            const result = createNewDraft(
                action,
                { data: message } as MessageStateWithData,
                mailSettings,
                userSettings,
                addresses,
                jest.fn()
            );
            expect(result.data?.AddressID).toBe(address.ID);
        });

        it('should add ParentID when not a copy', () => {
            notNewActions.forEach((action) => {
                const result = createNewDraft(
                    action,
                    { data: message } as MessageStateWithData,
                    mailSettings,
                    userSettings,
                    addresses,
                    jest.fn()
                );
                expect(result.draftFlags?.ParentID).toBe(ID);
            });
        });

        it('should set a value to recipient lists', () => {
            allActions.forEach((action) => {
                const result = createNewDraft(
                    action,
                    { data: message } as MessageStateWithData,
                    mailSettings,
                    userSettings,
                    addresses,
                    jest.fn()
                );
                expect(result.data?.ToList?.length).toBeDefined();
                expect(result.data?.CCList?.length).toBeDefined();
                expect(result.data?.BCCList?.length).toBeDefined();
            });
        });

        // TODO: Feature to be implemented
        // it('should set a value to Attachments', () => {
        //     expect(item.Attachments).toEqual(DEFAULT_MESSAGE_COPY.Attachments);
        // });

        it('should use values from handleActions', () => {
            const result = createNewDraft(
                MESSAGE_ACTIONS.REPLY_ALL,
                { data: { ...message, Flags: MESSAGE_FLAGS.FLAG_RECEIVED } } as MessageStateWithData,
                mailSettings,
                userSettings,
                addresses,
                jest.fn()
            );
            expect(result.data?.Subject).toBe(`${RE_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([recipient4]);
            expect(result.data?.CCList).toEqual([recipient1, recipient2]);
            expect(result.data?.BCCList).toEqual([]);
        });

        it('should use values from findSender', () => {
            const result = createNewDraft(
                action,
                { data: message } as MessageStateWithData,
                mailSettings,
                userSettings,
                addresses,
                jest.fn()
            );
            expect(result.data?.AddressID).toBe(address.ID);
            expect(result.data?.Sender?.Address).toBe(address.Email);
            expect(result.data?.Sender?.Name).toBe(address.DisplayName);
        });
    });

    describe('getBlockquoteRecipientsString', () => {
        it('should return the expected recipient string for blockquotes', () => {
            const recipientList = [
                { Name: 'Display Name', Address: 'address@protonmail.com' },
                { Name: '', Address: 'address2@protonmail.com' },
                { Address: 'address3@protonmail.com' },
            ] as Recipient[];

            const expectedString = `Display Name &lt;address@protonmail.com&gt;, address2@protonmail.com &lt;address2@protonmail.com&gt;, address3@protonmail.com &lt;address3@protonmail.com&gt;`;

            expect(getBlockquoteRecipientsString(recipientList)).toEqual(expectedString);
        });
    });

    describe('generatePreviousMessageInfos', () => {
        const messageSubject = 'Subject';
        const meRecipient = { Name: 'me', Address: 'me@protonmail.com' };
        const toRecipient = { Name: 'toRecipient', Address: 'toRecipient@protonmail.com' };
        const ccRecipient = { Address: 'ccRecipient@protonmail.com' };
        const sender = { Name: 'sender', Address: 'sender@protonmail.com' } as Recipient;
        const toList = [meRecipient, toRecipient] as Recipient[];
        const ccList = [ccRecipient] as Recipient[];

        const generateMessage = (hasCCList = true) => {
            return {
                localID: ID,
                data: {
                    ID,
                    Subject: messageSubject,
                    Sender: sender,
                    ToList: toList,
                    CCList: hasCCList ? ccList : undefined,
                },
            } as MessageState;
        };

        it('should return the correct message blockquotes info for a reply', () => {
            const referenceMessage = generateMessage();

            const messageBlockquotesInfos = generatePreviousMessageInfos(referenceMessage, MESSAGE_ACTIONS.REPLY);

            const expectedString = `${ORIGINAL_MESSAGE}<br>
        On ${formatFullDate(new Date(0))}, ${referenceMessage.data?.Sender.Name} &lt;${
                referenceMessage.data?.Sender.Address
            }&gt; wrote:<br><br>`;

            expect(messageBlockquotesInfos).toEqual(expectedString);
        });

        it('should return the correct message blockquotes info for a forward', () => {
            const referenceMessage = generateMessage();

            const messageBlockquotesInfos = generatePreviousMessageInfos(referenceMessage, MESSAGE_ACTIONS.FORWARD);

            const expectedString = `${FORWARDED_MESSAGE}<br>
        From: ${referenceMessage.data?.Sender.Name} &lt;${referenceMessage.data?.Sender.Address}&gt;<br>
        Date: On ${formatFullDate(new Date(0))}<br>
        Subject: ${messageSubject}<br>
        To: ${meRecipient.Name} &lt;${meRecipient.Address}&gt;, ${toRecipient.Name} &lt;${toRecipient.Address}&gt;<br>
        CC: ${ccRecipient.Address} &lt;${ccRecipient.Address}&gt;<br><br>`;

            expect(messageBlockquotesInfos).toEqual(expectedString);
        });

        it('should return the correct message blockquotes info for a forward with no CC', () => {
            const referenceMessage = generateMessage(false);

            const messageBlockquotesInfos = generatePreviousMessageInfos(referenceMessage, MESSAGE_ACTIONS.FORWARD);

            const expectedString = `${FORWARDED_MESSAGE}<br>
        From: ${referenceMessage.data?.Sender.Name} &lt;${referenceMessage.data?.Sender.Address}&gt;<br>
        Date: On ${formatFullDate(new Date(0))}<br>
        Subject: ${messageSubject}<br>
        To: ${meRecipient.Name} &lt;${meRecipient.Address}&gt;, ${toRecipient.Name} &lt;${toRecipient.Address}&gt;<br>
        <br>`;

            expect(messageBlockquotesInfos).toEqual(expectedString);
        });
    });
});
