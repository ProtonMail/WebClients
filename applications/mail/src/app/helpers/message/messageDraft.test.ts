import { Address, MailSettings } from 'proton-shared/lib/interfaces';
import { MESSAGE_FLAGS } from 'proton-shared/lib/mail/constants';
import { formatSubject, FW_PREFIX, RE_PREFIX } from 'proton-shared/lib/mail/messages';
import { MESSAGE_ACTIONS } from '../../constants';

import { handleActions, createNewDraft } from './messageDraft';
import { MessageExtendedWithData } from '../../models/message';

const ID = 'ID';
const Time = 0;
const Subject = 'test';
const recipient1 = { Address: 'test 1' };
const recipient2 = { Address: 'test 2' };
const recipient3 = { Address: 'test 3' };
const recipient4 = { Address: 'test 4' };

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
const address = {
    ID: 'addressid',
    DisplayName: 'name',
    Email: 'email',
    Status: 1,
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
            } as MessageExtendedWithData);
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
            } as MessageExtendedWithData);

            expect(result.data?.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([recipient4]);
        });

        it('should prepare a reply for sent message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_SENT,
                },
            } as MessageExtendedWithData);

            expect(result.data?.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([recipient1]);
        });

        it('should prepare a reply for received and sent message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_SENT | MESSAGE_FLAGS.FLAG_RECEIVED,
                },
            } as MessageExtendedWithData);

            expect(result.data?.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([recipient1]);
        });

        it('should prepare a reply all for received message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY_ALL, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
                },
            } as MessageExtendedWithData);

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
            } as MessageExtendedWithData);

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
            } as MessageExtendedWithData);

            expect(result.data?.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([recipient1]);
            expect(result.data?.CCList).toEqual([recipient2]);
            expect(result.data?.BCCList).toEqual([recipient3]);
        });

        it('should prepare a forward', () => {
            const result = handleActions(MESSAGE_ACTIONS.FORWARD, { data: message } as MessageExtendedWithData);

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
                { data: message } as MessageExtendedWithData,
                mailSettings,
                addresses
            );
            expect(result.document?.innerHTML).toContain(address.Signature);
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
                { data: message } as MessageExtendedWithData,
                mailSettings,
                addresses
            );
            expect(result.data?.AddressID).toBe(address.ID);
        });

        it('should add ParentID when not a copy', () => {
            notNewActions.forEach((action) => {
                const result = createNewDraft(
                    action,
                    { data: message } as MessageExtendedWithData,
                    mailSettings,
                    addresses
                );
                expect(result.ParentID).toBe(ID);
            });
        });

        it('should set a value to recipient lists', () => {
            allActions.forEach((action) => {
                const result = createNewDraft(
                    action,
                    { data: message } as MessageExtendedWithData,
                    mailSettings,
                    addresses
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
                { data: { ...message, Flags: MESSAGE_FLAGS.FLAG_RECEIVED } } as MessageExtendedWithData,
                mailSettings,
                addresses
            );
            expect(result.data?.Subject).toBe(`${RE_PREFIX} ${Subject}`);
            expect(result.data?.ToList).toEqual([recipient4]);
            expect(result.data?.CCList).toEqual([recipient1, recipient2]);
            expect(result.data?.BCCList).toEqual([]);
        });

        it('should use values from findSender', () => {
            const result = createNewDraft(
                action,
                { data: message } as MessageExtendedWithData,
                mailSettings,
                addresses
            );
            expect(result.data?.AddressID).toBe(address.ID);
            expect(result.data?.Sender?.Address).toBe(address.Email);
            expect(result.data?.Sender?.Name).toBe(address.DisplayName);
        });
    });
});
