import { Address, MailSettings } from 'proton-shared/lib/interfaces';
import { MESSAGE_ACTIONS, MESSAGE_FLAGS } from '../../constants';

import { formatSubject, handleActions, RE_PREFIX, FW_PREFIX, createNewDraft } from './messageDraft';
import { insertSignature } from './messageSignature';
import { findSender } from '../addresses';
import { MessageExtendedWithData } from '../../models/message';

jest.mock('./messageSignature', () => ({
    insertSignature: jest.fn()
}));

jest.mock('../addresses', () => ({
    findSender: jest.fn(),
    recipientToInput: jest.fn()
}));

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
    ReplyTos: [recipient4]
};

const allActions = [MESSAGE_ACTIONS.NEW, MESSAGE_ACTIONS.REPLY, MESSAGE_ACTIONS.REPLY_ALL, MESSAGE_ACTIONS.FORWARD];
const notNewActions = [MESSAGE_ACTIONS.REPLY, MESSAGE_ACTIONS.REPLY_ALL, MESSAGE_ACTIONS.FORWARD];
const action = MESSAGE_ACTIONS.NEW;
const mailSettings = {} as MailSettings;
const addresses: Address[] = [];

describe('messageDraft', () => {
    afterEach(() => {
        ([insertSignature, findSender] as jest.Mock[]).forEach((mock) => mock.mockClear());
    });

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
            expect(result.Subject).toEqual('');
            expect(result.ToList).toEqual([]);
            expect(result.CCList).toEqual([]);
            expect(result.BCCList).toEqual([]);
        });

        it('should copy values', () => {
            const result = handleActions(MESSAGE_ACTIONS.NEW, {
                data: {
                    Subject: Subject,
                    ToList: [recipient1],
                    CCList: [recipient2],
                    BCCList: [recipient3]
                }
            } as MessageExtendedWithData);
            expect(result.Subject).toEqual(Subject);
            expect(result.ToList).toEqual([recipient1]);
            expect(result.CCList).toEqual([recipient2]);
            expect(result.BCCList).toEqual([recipient3]);
        });

        it('should prepare a reply for received message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_RECEIVED
                }
            } as MessageExtendedWithData);

            expect(result.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.ToList).toEqual([recipient4]);
        });

        it('should prepare a reply for sent message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_SENT
                }
            } as MessageExtendedWithData);

            expect(result.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.ToList).toEqual([recipient1]);
        });

        it('should prepare a reply for received and sent message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_SENT | MESSAGE_FLAGS.FLAG_RECEIVED
                }
            } as MessageExtendedWithData);

            expect(result.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.ToList).toEqual([recipient1]);
        });

        it('should prepare a reply all for received message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY_ALL, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_RECEIVED
                }
            } as MessageExtendedWithData);

            expect(result.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.ToList).toEqual([recipient4]);
            expect(result.CCList).toEqual([recipient1, recipient2]);
            expect(result.BCCList).toEqual(undefined);
        });

        it('should prepare a reply all for sent message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY_ALL, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_SENT
                }
            } as MessageExtendedWithData);

            expect(result.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.ToList).toEqual([recipient1]);
            expect(result.CCList).toEqual([recipient2]);
            expect(result.BCCList).toEqual([recipient3]);
        });

        it('should prepare a reply all for received and sent message', () => {
            const result = handleActions(MESSAGE_ACTIONS.REPLY_ALL, {
                data: {
                    ...message,
                    Flags: MESSAGE_FLAGS.FLAG_SENT | MESSAGE_FLAGS.FLAG_RECEIVED
                }
            } as MessageExtendedWithData);

            expect(result.Subject).toEqual(`${RE_PREFIX} ${Subject}`);
            expect(result.ToList).toEqual([recipient1]);
            expect(result.CCList).toEqual([recipient2]);
            expect(result.BCCList).toEqual([recipient3]);
        });

        it('should prepare a forward', () => {
            const result = handleActions(MESSAGE_ACTIONS.FORWARD, { data: message } as MessageExtendedWithData);

            expect(result.Subject).toEqual(`${FW_PREFIX} ${Subject}`);
            expect(result.ToList).toEqual([]);
            expect(result.CCList).toEqual(undefined);
            expect(result.BCCList).toEqual(undefined);
        });
    });

    describe('createNewDraft', () => {
        it('should use insertSignature', () => {
            createNewDraft(action, { data: message } as MessageExtendedWithData, mailSettings, addresses);
            expect(insertSignature).toHaveBeenCalledWith('', undefined, action, mailSettings);
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
            createNewDraft(action, { data: message } as MessageExtendedWithData, mailSettings, addresses);
            expect(findSender).toHaveBeenCalledWith(addresses, message);
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
            const address: Partial<Address> = { ID, Email: 'Email', DisplayName: 'DisplayName' };
            (findSender as jest.Mock).mockReturnValue(address);
            const result = createNewDraft(
                action,
                { data: message } as MessageExtendedWithData,
                mailSettings,
                addresses
            );
            expect(result.data?.AddressID).toBe(ID);
            expect(result.data?.Sender?.Address).toBe(address.Email);
            expect(result.data?.Sender?.Name).toBe(address.DisplayName);
        });
    });
});
