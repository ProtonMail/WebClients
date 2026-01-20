import { addDays, differenceInDays, getUnixTime, isSameDay } from 'date-fns';

import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import { addPlusAlias } from '@proton/shared/lib/helpers/email';
import type { Address, MailSettings, Recipient, UserSettings } from '@proton/shared/lib/interfaces';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { FORWARDED_MESSAGE, FW_PREFIX, RE_PREFIX, formatSubject } from '@proton/shared/lib/mail/messages';

import { createNewDraft, formatRecipientsString, handleActions } from './messageDraft';

const ID = 'ID';
const now = new Date();
const receiveDate = addDays(now, -5);
const Time = getUnixTime(receiveDate);
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
        describe('general behaviour', () => {
            it('should load the sender', () => {
                const result = createNewDraft({
                    action,
                    referenceMessage: { data: message } as MessageStateWithData,
                    mailSettings,
                    userSettings,
                    addresses,
                    getAttachment: jest.fn(),
                });
                expect(result.data?.AddressID).toBe(address.ID);
            });

            it('should add ParentID when not a copy', () => {
                notNewActions.forEach((action) => {
                    const result = createNewDraft({
                        action,
                        referenceMessage: { data: message } as MessageStateWithData,
                        mailSettings,
                        userSettings,
                        addresses,
                        getAttachment: jest.fn(),
                    });
                    expect(result.draftFlags?.ParentID).toBe(ID);
                });
            });

            it('should set a value to recipient lists', () => {
                allActions.forEach((action) => {
                    const result = createNewDraft({
                        action,
                        referenceMessage: { data: message } as MessageStateWithData,
                        mailSettings,
                        userSettings,
                        addresses,
                        getAttachment: jest.fn(),
                    });
                    expect(result.data?.ToList?.length).toBeDefined();
                    expect(result.data?.CCList?.length).toBeDefined();
                    expect(result.data?.BCCList?.length).toBeDefined();
                });
            });

            it('should use values from handleActions', () => {
                const result = createNewDraft({
                    action: MESSAGE_ACTIONS.REPLY_ALL,
                    referenceMessage: {
                        data: {
                            ...message,
                            Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
                        },
                    } as MessageStateWithData,
                    mailSettings,
                    userSettings,
                    addresses,
                    getAttachment: jest.fn(),
                });
                expect(result.data?.Subject).toBe(`${RE_PREFIX} ${Subject}`);
                expect(result.data?.ToList).toEqual([recipient4]);
                expect(result.data?.CCList).toEqual([recipient1, recipient2]);
                expect(result.data?.BCCList).toEqual([]);
            });

            it("should preset expiration date it's set on the original message", () => {
                // Expiration time is a Unix timestamp
                const expirationDate = addDays(now, 5);
                const expirationTime = getUnixTime(expirationDate);
                const result = createNewDraft({
                    action: MESSAGE_ACTIONS.REPLY,
                    referenceMessage: { data: { ...message, ExpirationTime: expirationTime } } as MessageStateWithData,
                    mailSettings,
                    userSettings,
                    addresses,
                    getAttachment: jest.fn(),
                });
                const { expiresIn } = result.draftFlags || {};
                expect(expiresIn).toBeDefined();
                expect(expiresIn).toBeInstanceOf(Date);
                const delta = differenceInDays(expirationDate, receiveDate);

                if (expiresIn) {
                    expect(isSameDay(expiresIn, addDays(now, delta))).toBeTruthy();
                }
            });

            it('should use values from findSender', () => {
                const result = createNewDraft({
                    action,
                    referenceMessage: { data: message } as MessageStateWithData,
                    mailSettings,
                    userSettings,
                    addresses,
                    getAttachment: jest.fn(),
                });
                expect(result.data?.AddressID).toBe(address.ID);
                expect(result.data?.Sender?.Address).toBe(address.Email);
                expect(result.data?.Sender?.Name).toBe(address.DisplayName);
            });

            it('should handle attachments in forward action', () => {
                const messageWithAttachments = {
                    ...message,
                    Attachments: [
                        { ID: 'att1', Name: 'file.pdf' },
                        { ID: 'att2', Name: 'image.jpg' },
                    ],
                };

                const getAttachment = jest.fn((id: string) => ({
                    attachment: { ID: id, Name: id === 'att1' ? 'file.pdf' : 'image.jpg' },
                }));

                const result = createNewDraft({
                    action: MESSAGE_ACTIONS.FORWARD,
                    referenceMessage: { data: messageWithAttachments } as MessageStateWithData,
                    mailSettings,
                    userSettings,
                    addresses,
                    getAttachment: getAttachment as any,
                });

                expect(result.data?.Attachments?.length).toBeGreaterThan(0);
            });
        });

        describe('HTML draft', () => {
            it('should create HTML document with signature', () => {
                const result = createNewDraft({
                    action,
                    referenceMessage: { data: message } as MessageStateWithData,
                    mailSettings,
                    userSettings,
                    addresses,
                    getAttachment: jest.fn(),
                });
                expect(result.messageDocument?.document).toBeDefined();
                expect(result.messageDocument?.document?.innerHTML).toContain(address.Signature);
                expect(result.messageDocument?.plainText).toBeUndefined();
            });

            it('should generate HTML blockquote when replying', () => {
                const result = createNewDraft({
                    action: MESSAGE_ACTIONS.REPLY,
                    referenceMessage: {
                        data: { ...message, Flags: MESSAGE_FLAGS.FLAG_RECEIVED },
                        decryption: { decryptedBody: '<p>Original HTML message</p>' },
                    } as MessageStateWithData,
                    mailSettings,
                    userSettings,
                    addresses,
                    getAttachment: jest.fn(),
                });
                expect(result.messageDocument?.document).toBeDefined();
                expect(result.messageDocument?.document?.innerHTML).toContain('blockquote');
            });
        });

        describe('plaintext draft', () => {
            const plaintextMailSettings = { DraftMIMEType: 'text/plain' } as MailSettings;

            it('should create plaintext new draft', () => {
                const plaintextMessage = {
                    ID,
                    Time,
                    Subject,
                    MIMEType: 'text/plain',
                };

                const result = createNewDraft({
                    action: MESSAGE_ACTIONS.NEW,
                    referenceMessage: {
                        data: plaintextMessage,
                        decryption: { decryptedBody: 'This is plain text content' },
                    } as MessageStateWithData,
                    mailSettings: plaintextMailSettings,
                    userSettings,
                    addresses,
                    getAttachment: jest.fn(),
                });

                expect(result.messageDocument?.plainText).toBeDefined();
                expect(result.messageDocument?.document).toBeUndefined();
            });

            it('should handle plaintext reply blockquotes', () => {
                const plaintextMessage = {
                    ID,
                    Time,
                    Subject,
                    Sender: { Name: 'sender', Address: 'sender@protonmail.com' },
                    MIMEType: 'text/plain',
                    Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
                };

                const result = createNewDraft({
                    action: MESSAGE_ACTIONS.REPLY,
                    referenceMessage: {
                        data: plaintextMessage,
                        decryption: { decryptedBody: 'Original message content' },
                    } as MessageStateWithData,
                    mailSettings: plaintextMailSettings,
                    userSettings,
                    addresses,
                    getAttachment: jest.fn(),
                });

                expect(result.messageDocument?.plainText).toBeDefined();
                expect(result.messageDocument?.plainText).toContain('> Original message content');
                expect(result.messageDocument?.document).toBeUndefined();
            });

            it('should format plaintext forward blockquotes', () => {
                const plaintextMessage = {
                    ID,
                    Time,
                    Subject,
                    Sender: { Name: 'sender', Address: 'sender@protonmail.com' },
                    ToList: [recipient1],
                    MIMEType: 'text/plain',
                    Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
                };

                const result = createNewDraft({
                    action: MESSAGE_ACTIONS.FORWARD,
                    referenceMessage: {
                        data: plaintextMessage,
                        decryption: { decryptedBody: 'Message to forward' },
                    } as MessageStateWithData,
                    mailSettings: plaintextMailSettings,
                    userSettings,
                    addresses,
                    getAttachment: jest.fn(),
                });

                expect(result.messageDocument?.plainText).toBeDefined();
                expect(result.messageDocument?.plainText).toContain('> Message to forward');
                expect(result.messageDocument?.plainText).toContain(FORWARDED_MESSAGE);
            });

            it('should include signature in plaintext draft', () => {
                const plaintextMessage = {
                    ID,
                    Time,
                    Subject,
                    MIMEType: 'text/plain',
                };

                const result = createNewDraft({
                    action: MESSAGE_ACTIONS.NEW,
                    referenceMessage: {
                        data: plaintextMessage,
                        decryption: { decryptedBody: 'Content' },
                    } as MessageStateWithData,
                    mailSettings: plaintextMailSettings,
                    userSettings,
                    addresses,
                    getAttachment: jest.fn(),
                });

                expect(result.messageDocument?.plainText).toBeDefined();
                // The signature should be converted from HTML to plaintext
                expect(result.messageDocument?.plainText).toContain(address.Signature);
            });
        });
    });

    describe('formatRecipientsString', () => {
        describe('HTML draft', () => {
            it('should return the expected recipient string for HTML blockquotes', () => {
                const recipientList = [
                    { Name: 'Display Name', Address: 'address@protonmail.com' },
                    { Name: '', Address: 'address2@protonmail.com' },
                    { Address: 'address3@protonmail.com' },
                ] as Recipient[];

                const expectedString = `Display Name &lt;address@protonmail.com&gt;, address2@protonmail.com &lt;address2@protonmail.com&gt;, address3@protonmail.com &lt;address3@protonmail.com&gt;`;

                expect(formatRecipientsString(recipientList, 'html')).toEqual(expectedString);
            });

            it('should generate html blockquote recipient string with multiple recipients', () => {
                const recipientList = [
                    { Name: 'Display Name', Address: 'address@protonmail.com' },
                    { Name: '', Address: 'address2@protonmail.com' },
                    { Address: 'address3@protonmail.com' },
                ] as Recipient[];

                const expectedString = `Display Name &lt;address@protonmail.com&gt;, address2@protonmail.com &lt;address2@protonmail.com&gt;, address3@protonmail.com &lt;address3@protonmail.com&gt;`;

                expect(formatRecipientsString(recipientList, 'html')).toEqual(expectedString);
            });

            it('should generate empty html blockquote recipient string if no recipient', () => {
                expect(formatRecipientsString([], 'html')).toEqual('');
            });
        });

        describe('plaintext draft', () => {
            it('should generate plaintext blockquote recipient string', () => {
                const recipientList = [{ Address: 'test@protonmail.com' }] as Recipient[];
                const expectedString = 'test@protonmail.com <test@protonmail.com>';

                expect(formatRecipientsString(recipientList, 'plaintext')).toEqual(expectedString);
            });

            it('should generate plaintext blockquote recipient string with multiple recipients', () => {
                const recipientList = [
                    { Name: 'Display Name', Address: 'address@protonmail.com' },
                    { Name: '', Address: 'address2@protonmail.com' },
                    { Address: 'address3@protonmail.com' },
                ] as Recipient[];

                const expectedString = `Display Name <address@protonmail.com>, address2@protonmail.com <address2@protonmail.com>, address3@protonmail.com <address3@protonmail.com>`;

                expect(formatRecipientsString(recipientList, 'plaintext')).toEqual(expectedString);
            });

            it('should generate empty plaintext blockquote recipient string if no recipient', () => {
                expect(formatRecipientsString([], 'plaintext')).toEqual('');
            });
        });
    });
});
