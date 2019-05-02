import _ from 'lodash';
import service, {
    formatSubject,
    createMessage,
    omitUserAddresses,
    injectInline,
    findSender
} from '../../../../src/app/message/services/messageBuilder';
import { REPLY_ALL, REPLY, FORWARD, MESSAGE_FLAGS } from '../../../../src/app/constants';

const RE_PREFIX = 'Re:';
const FW_PREFIX = 'Fw:';

describe('Format subject', () => {
    const listRe = [
        'Subject',
        'Re: Subject',
        'Fw: Subject',
        'Fw: Re: Subject',
        'Re: Fw: Subject'
    ];

    const listFw = [
        'Subject',
        'Re: Subject',
        'Fw: Subject',
        'Fw: Re: Subject',
        'Re: Fw: Subject'
    ];

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

describe('Filter user addresses', () => {

    const list = [
        {
            id: 1,
            Headers: {
                'content-disposition': 'inline'
            }
        },
        {
            id: 2,
            Headers: {
                'content-disposition': 'jeanne'
            }
        },
        {
            id: 3,
            Headers: {}
        }
    ];

    it('should filter only inline attachments', () => {
        const delta = injectInline();
        expect(delta.length).toBe(0);
    });

    it('should filter only inline attachments', () => {
        const delta = injectInline({ Attachments: list });
        expect(delta.length).toBe(1);
        expect(delta[0].id).toBe(1);
    });
});

describe('inject inline attachments', () => {

    const list = ['user@lol.com', 'nope@foo.bar'].map((Address) => ({ Address }));
    const userList = ['user@lol.com'];

    it('should remove nothing if no addresses are inside the user', () => {
        const delta = omitUserAddresses(list);
        expect(delta.length).toBe(2);
        expect(delta[0].Address).toBe('user@lol.com');
        expect(delta[1].Address).toBe('nope@foo.bar');
    });
    it('should remove the user address', () => {
        const delta = omitUserAddresses(list, userList);
        expect(delta.length).toBe(1);
        expect(delta[0].Address).toBe('nope@foo.bar');
    });
});

describe('Create type of message', () => {

    describe('Create a copy', () => {

        const { newCopy } = createMessage();
        const message = {
            setDecryptedBody: _.identity
        };

        beforeEach(() => {
            delete message.Subject;
            delete message.ToList;
            delete message.CCList;
            delete message.BCCList;
        });

        describe('Empty copy', () => {

            beforeEach(() => {
                spyOn(message, 'setDecryptedBody');
                newCopy(message);
            });

            it('should bind empty values', () => {
                expect(message.Subject).toEqual('');
                expect(message.ToList).toEqual([]);
                expect(message.CCList).toEqual([]);
                expect(message.BCCList).toEqual([]);
            });

            it('should not set decryptedbody', () => {
                expect(message.setDecryptedBody).not.toHaveBeenCalled();
            });
        });

        describe('Copy without decrypted body', () => {

            beforeEach(() => {
                spyOn(message, 'setDecryptedBody');
                newCopy(message, {
                    Subject: 'monique',
                    ToList: ['lol 1'],
                    CCList: ['lol 2'],
                    BCCList: ['lol 3']
                });
            });

            it('should bind values', () => {
                expect(message.Subject).toEqual('monique');
                expect(message.ToList).toEqual(['lol 1']);
                expect(message.CCList).toEqual(['lol 2']);
                expect(message.BCCList).toEqual(['lol 3']);
            });

            it('should not set decryptedbody', () => {
                expect(message.setDecryptedBody).not.toHaveBeenCalled();
            });
        });

        describe('Copy with decrypted body', () => {

            beforeEach(() => {
                spyOn(message, 'setDecryptedBody');
                newCopy(message, {
                    Subject: 'monique',
                    ToList: ['lol 1'],
                    CCList: ['lol 2'],
                    BCCList: ['lol 3'],
                    DecryptedBody: 'lol'
                });
            });

            it('should bind values', () => {
                expect(message.Subject).toEqual('monique');
                expect(message.ToList).toEqual(['lol 1']);
                expect(message.CCList).toEqual(['lol 2']);
                expect(message.BCCList).toEqual(['lol 3']);
            });

            it('should not set decryptedbody', () => {
                expect(message.setDecryptedBody).toHaveBeenCalledWith('lol');
                expect(message.setDecryptedBody).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('Create a reply', () => {

        const { reply } = createMessage([], { RE_PREFIX, FW_PREFIX });
        const message = {
            Subject: 'monique',
            ToList: ['yolo@pt.com'],
            ReplyTos: ['jeanne@pt.com']
        };

        describe('Flag received', () => {

            const newMsg = {};

            beforeEach(() => {
                message.Flags = MESSAGE_FLAGS.FLAG_RECEIVED;
                reply(newMsg, message);
            });

            it('should bind values', () => {
                expect(newMsg.Subject).toEqual(`${RE_PREFIX} monique`);
                expect(newMsg.ToList).toEqual(['jeanne@pt.com']);
                expect(newMsg.Action).toEqual(REPLY);
            });
        });

        describe('Flag sent', () => {

            const newMsg = {};

            beforeEach(() => {
                message.Flags = MESSAGE_FLAGS.FLAG_SENT;
                reply(newMsg, message);
            });

            it('should bind values', () => {
                expect(newMsg.Subject).toEqual(`${RE_PREFIX} monique`);
                expect(newMsg.ToList).toEqual(['yolo@pt.com']);
                expect(newMsg.Action).toEqual(REPLY);
            });
        });

        describe('Flag received and sent', () => {

            const newMsg = {};

            beforeEach(() => {
                message.Flags = MESSAGE_FLAGS.FLAG_SENT | MESSAGE_FLAGS.FLAG_RECEIVED;
                reply(newMsg, message);
            });

            it('should bind values', () => {
                expect(newMsg.Subject).toEqual(`${RE_PREFIX} monique`);
                expect(newMsg.ToList).toEqual(['yolo@pt.com']);
                expect(newMsg.Action).toEqual(REPLY);
            });
        });
    });

    describe('Create a replyAll', () => {

        const { replyAll } = createMessage([{
            Email: 'yoloCC@pt.com'
        }], { RE_PREFIX, FW_PREFIX });
        const message = {
            Subject: 'monique',
            ToList: [{ Address: 'yolo@pt.com' }],
            CCList: [{ Address: 'yoloCC@pt.com' }],
            BCCList: ['yoloBCC@pt.com'],
            ReplyTos: ['jeanne@pt.com']
        };

        describe('Flag received', () => {

            const newMsg = {};

            beforeEach(() => {
                message.Flags = MESSAGE_FLAGS.FLAG_RECEIVED;
                replyAll(newMsg, message);
            });

            it('should bind values', () => {
                expect(newMsg.Subject).toEqual(`${RE_PREFIX} monique`);
                expect(newMsg.ToList).toEqual(['jeanne@pt.com']);
                expect(newMsg.CCList).toEqual([{ Address: 'yolo@pt.com' }]);
                expect(newMsg.BCCList).toEqual(undefined);
                expect(newMsg.Action).toEqual(REPLY_ALL);
            });
        });

        describe('Flag sent', () => {

            const newMsg = {};

            beforeEach(() => {
                message.Flags = MESSAGE_FLAGS.FLAG_SENT;
                replyAll(newMsg, message);
            });

            it('should bind values', () => {
                expect(newMsg.Subject).toEqual(`${RE_PREFIX} monique`);
                expect(newMsg.ToList).toEqual([{ Address: 'yolo@pt.com' }]);
                expect(newMsg.CCList).toEqual([{ Address: 'yoloCC@pt.com' }]);
                expect(newMsg.BCCList).toEqual(['yoloBCC@pt.com']);
                expect(newMsg.Action).toEqual(REPLY_ALL);
            });
        });

        describe('Flag received and sent', () => {

            const newMsg = {};

            beforeEach(() => {
                message.Flags = MESSAGE_FLAGS.FLAG_RECEIVED | MESSAGE_FLAGS.FLAG_SENT;
                replyAll(newMsg, message);
            });

            it('should bind values', () => {
                expect(newMsg.Subject).toEqual(`${RE_PREFIX} monique`);
                expect(newMsg.ToList).toEqual([{ Address: 'yolo@pt.com' }]);
                expect(newMsg.CCList).toEqual([{ Address: 'yoloCC@pt.com' }]);
                expect(newMsg.BCCList).toEqual(['yoloBCC@pt.com']);
                expect(newMsg.Action).toEqual(REPLY_ALL);
            });
        });
    });

    describe('Create a forward', () => {

        const { forward } = createMessage([], { RE_PREFIX, FW_PREFIX });
        const message = {
            Subject: 'monique',
            ToList: ['yolo@pt.com'],
            CCList: ['yoloCC@pt.com'],
            BCCList: ['yoloBCC@pt.com'],
            ReplyTos: ['jeanne@pt.com']
        };

        describe('Empty ToList', () => {

            const newMsg = {};

            beforeEach(() => {
                forward(newMsg, message);
            });

            it('should bind values', () => {
                expect(newMsg.Subject).toEqual(`${FW_PREFIX} monique`);
                expect(newMsg.ToList).toEqual([]);
                expect(newMsg.CCList).toEqual(undefined);
                expect(newMsg.BCCList).toEqual(undefined);
                expect(newMsg.Action).toEqual(FORWARD);
            });
        });

    });
});

describe('Find the sender', () => {
    describe('No addresses no message', () => {
        let output;
        beforeEach(() => {
            output = findSender();
        });

        it('should return an empty object', () => {
            expect(output).toEqual({});
        });
    });

    describe('No addresses message', () => {
        let output;
        beforeEach(() => {
            output = findSender([], { AddressID: 1 });
        });

        it('should return an empty object', () => {
            expect(output).toEqual({});
        });
    });

    describe('Addresses but no match', () => {
        let output;
        beforeEach(() => {
            const addresses = [{ Status: 2 }];
            output = findSender(addresses, { AddressID: 1 });
        });

        it('should return an empty object', () => {
            expect(output).toEqual({});
        });
    });

    describe('Addresses valid but no match', () => {
        let output;
        const match = { Status: 1, Order: 1, ID: 2 };
        beforeEach(() => {
            const addresses = [{ Status: 2 }, match, { Status: 1, Order: 2, ID: 3 }];
            output = findSender(addresses, { AddressID: 1 });
        });

        it('should return the first address', () => {
            expect(output).toEqual(match);
        });
    });

    describe('Addresses order valid but no match', () => {
        let output;
        const match = { Status: 1, Order: 1, ID: 2 };
        beforeEach(() => {
            const addresses = [{ Status: 2, ID: 1, Order: 0 }, { Status: 1, Order: 2, ID: 3 }, match];
            output = findSender(addresses, { AddressID: 1 });
        });

        it('should return the first address ordered', () => {
            expect(output).toEqual(match);
        });
    });

    describe('Addresses order valid  match', () => {
        let output;
        const match = { Status: 1, Order: 1, ID: 2 };
        const matchMessage = { Status: 1, Order: 2, ID: 1 };
        beforeEach(() => {
            const addresses = [{ Status: 2 }, matchMessage, match];
            output = findSender(addresses, { AddressID: 1 });
        });

        it('should return the matching ID from message', () => {
            expect(output).toEqual(matchMessage);
        });
    });
});


describe('messageBuilder factory', () => {
    let spyUpdateSignature = jasmine.createSpy();
    let spyGetDecryptedBody = jasmine.createSpy();
    let spySetDecryptedBody = jasmine.createSpy();
    let spyMessageModelMock = jasmine.createSpy();
    let spyLocalReadableTime = jasmine.createSpy();
    let spyPrepareContent = jasmine.createSpy();
    let spyTranslator = jasmine.createSpy();
    let userMock = { Signature: '', DraftMIMEType: 'text/html' };

    let rootScope, factory;

    const mailSettingsMock = { Signature: '', DraftMIMEType: 'text/html', RightToLeft: undefined };
    const mailSettingsModel = { get: (k) => mailSettingsMock[k] };
    const gettextCatalog = { getString: _.identity };
    const sanitize = { input: _.identity, message: _.identity };
    const textToHtmlMail = { parse: _.identity };
    const addressesModel = { get() { return []; } };
    const confirmModal = {};
    const authentication = { user: userMock };
    const prepareContent = (...args) => {
        spyPrepareContent(...args);
        return 'prepareContent';
    };

    const pgpMimeAttachments = {
        clean(attachments) { return attachments; },
        filter() { return []; },
        handle() {}
    };

    const composerFromModel = {
        get() {
            return { address: {} };
        }
    };
    const signatureBuilder = {
        insert: _.noop,
        update(...args) {
            spyUpdateSignature(...args);
        }
    };

    const message = { getDecryptedBody: angular.noop };
    const MESSAGE_BODY = '<p>polo</p>';
    const MESSAGE_BODY_PLAIN = `Bonjour Polo,
Est-ce que tu vas bien ?
<lol> & noop
    `;
    const MESSAGE_BODY_PLAIN_ESCAPED = 'Bonjour Polo,<br />Est-ce que tu vas bien ?<br />&lt;lol&gt; &amp; noop<br />';
    const USER_SIGNATURE = '<strong>POPOPO</strong>';
    const USER_SIGNATURE2 = '<u>Dans la vie il y a des cactus</u>';
    const TESTABLE_ADDRESS_DEFAULT = { Status: 1, Receive: 1, Send: 2, ID: 42, Email: 'haquecoucou@mulot.fr' };

    let DEFAULT_MESSAGE;

    class Message {
        constructor(msg) {
            _.extend(this, angular.copy(msg));
            return this;
        }

        setDecryptedBody(input) {
            spySetDecryptedBody(input);
            this.DecryptedBody = input;
        }

        getDecryptedBody() {
            spyGetDecryptedBody();
            return MESSAGE_BODY;
        }
    }

    const messageModelMock = (data) => {
        spyMessageModelMock(data);
        return new Message(data);
    };

    const translator = (cb) => {
        const data = cb();
        spyTranslator(data);
        return data;
    };

    beforeEach(angular.mock.module('ng', ($provide) => {
        $provide.factory('localReadableTimeFilter', () => (...args) => {
            spyLocalReadableTime(...args);
            return 'localReadableTime';
        });
    }));
    beforeEach(
        angular.mock.inject(($injector) => {
            const $filter = $injector.get('$filter');
            spyOn(gettextCatalog, 'getString').and.callThrough();

            factory = service(
                $filter,
                addressesModel,
                composerFromModel,
                confirmModal,
                gettextCatalog,
                mailSettingsModel,
                messageModelMock,
                pgpMimeAttachments,
                prepareContent,
                signatureBuilder,
                translator,
                textToHtmlMail);

            DEFAULT_MESSAGE = {
                Flags: 0,
                Body: 'encrypted body',
                ToList: [],
                CCList: [],
                BCCList: [],
                Attachments: [],
                pgpMimeAttachments: [],
                numTags: [],
                recipientFields: [],
                MIMEType: 'text/html',
                RightToLeft: undefined,
                Subject: '',
                PasswordHint: '',
                ExpirationTime: 0,
                ExpiresIn: 0,
                From: TESTABLE_ADDRESS_DEFAULT,
                uploading: 0,
                toFocussed: false,
                autocompletesFocussed: false,
                new: true,
                ccbcc: false,
                AddressID: 42,
                NumEmbedded: 0,
                xOriginalTo: undefined,
                DecryptedBody: USER_SIGNATURE
            };
        })
    );

    it('should load translations', () => {
        expect(spyTranslator).toHaveBeenCalledTimes(2);
        expect(spyTranslator).toHaveBeenCalledWith({
            RE_PREFIX: jasmine.any(String),
            FW_PREFIX: jasmine.any(String)
        });

        expect(spyTranslator).toHaveBeenCalledWith({
            TITLE_ENCRYPTED_SUBJECT: jasmine.any(String),
            YES_CONFIRM: jasmine.any(String),
            NO_CONFIRM: jasmine.any(String),
            encryptedSubjectMessage: jasmine.any(Function)
        });
    })

    describe('Prepare sanitizes content with prepareContent', () => {
        it('should use the signatureBuilder factory', () => {
            const message = {
                getDecryptedBody() {
                    return 'body';
                },
                setDecryptedBody: jasmine.createSpy()
            };
            factory.prepare(message, 'reply');
            expect(spyPrepareContent).toHaveBeenCalledTimes(1);
            expect(spyPrepareContent).toHaveBeenCalledWith(message.getDecryptedBody(), message, {
                action: 'reply',
                blacklist: ['*']
            });
            expect(message.setDecryptedBody).toHaveBeenCalledTimes(1);
        });
    });


    describe('Update the signature', () => {
        it('should use the signatureBuilder factory', () => {
            factory.updateSignature('------', 1, 2);
            expect(spyUpdateSignature).toHaveBeenCalledWith('------', 1, 2);
        });
    });

    describe('Create a message', () => {

        createMessageTest({
            type: 'A new message from nothing',
            defaultMessageExtension: {},
            actionConstant: undefined,
            toList: [],
            ccList: [],
            bccList: [],
            subject: '',
            body: '',
            action: 'new',
            currentMessageExtension: {},
            createMessage: (currentMsg) => {
                const match = { Status: 1, Send: 1, ID: 2 };
                mailSettingsMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                return factory.create('new', currentMsg);
            }
        });

        createMessageTest({
            type: 'A new message from default config',
            defaultMessageExtension: {
                xOriginalTo: 'dew',
                Subject: 'polo',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette']
            },
            actionConstant: undefined,
            toList: ['bob'],
            ccList: ['bobby'],
            bccList: ['bobette'],
            subject: '',
            action: 'new',
            currentMessageExtension: {
                xOriginalTo: 'dew',
                Subject: 'polo',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette'],
                DecryptedBody: USER_SIGNATURE2
            },
            createMessage: (currentMsg) => {
                const match = { Status: 1, Send: 1, ID: 2 };
                mailSettingsMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                return factory.create('new', currentMsg);
            }
        });

        createMessageTest({
            type: 'A new message from default config as plain/text',
            defaultMessageExtension: {
                Subject: 'polo',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette'],
                MIMEType: 'text/plain'
            },
            actionConstant: undefined,
            toList: ['bob'],
            ccList: ['bobby'],
            bccList: ['bobette'],
            subject: '',
            action: 'new',
            currentMessageExtension: {
                Subject: 'polo',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette'],
                DecryptedBody: USER_SIGNATURE2
            },
            createMessage: (currentMsg) => {
                const match = { Status: 1, Send: 1, ID: 2 };
                mailSettingsMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                mailSettingsMock.DraftMIMEType = 'text/plain';
                return factory.create('new', currentMsg);
            }
        });

        const defaultReply = `‐‐‐‐‐‐‐ Original Message ‐‐‐‐‐‐‐<br>
                On {{date}}, {{name}} {{address}} wrote:<br>
                <blockquote class="protonmail_quote" type="cite">
                    prepareContent
                </blockquote><br>`;
        createMessageTest({
            type: 'A reply message',
            defaultMessageExtension: {
                Subject: 'polo',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette']
            },
            actionConstant: REPLY,
            toList: ['bob'],
            ccList: [],
            bccList: [],
            body: defaultReply,
            subject: 'Re: ',
            action: 'reply',
            currentMessageExtension: {
                ID: Date.now(),
                Flags: MESSAGE_FLAGS.FLAG_SENT,
                Subject: 'polo',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette'],
                Sender: {
                    Address: 'polo@test.com'
                },
                DecryptedBody: USER_SIGNATURE2
            },
            createMessage: (currentMsg) => {
                const match = { Status: 1, Send: 1, ID: 2 };
                mailSettingsMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                return factory.create('reply', currentMsg);
            }
        });

        createMessageTest({
            type: 'A reply message with MIMEType and userMimeType plaintext and type = 3',
            defaultMessageExtension: {
                Subject: 'polo',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette']
            },
            actionConstant: REPLY,
            parseText: true,
            toList: ['bob'],
            ccList: [],
            bccList: [],
            subject: 'Re: ',
            action: 'reply',
            body: defaultReply,
            currentMessageExtension: {
                ID: Date.now(),
                Flags: MESSAGE_FLAGS.FLAG_SENT | MESSAGE_FLAGS.FLAG_RECEIVED,
                Subject: 'Re: polo',
                MIMEType: 'text/plain',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette'],
                Sender: {
                    Address: 'polo@test.com'
                },
                DecryptedBody: USER_SIGNATURE2
            },
            createMessage: (currentMsg) => {
                const match = { Status: 1, Send: 1, ID: 2 };
                mailSettingsMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                mailSettingsMock.DraftMIMEType = 'text/plain';
                return factory.create('reply', currentMsg);
            }
        });

        createMessageTest({
            type: 'A reply message with MIMEType type = 3',
            defaultMessageExtension: {
                Subject: 'polo',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette']
            },
            actionConstant: REPLY,
            parseText: true,
            toList: ['bob'],
            ccList: [],
            bccList: [],
            subject: 'Re: ',
            action: 'reply',
            body: defaultReply,
            currentMessageExtension: {
                ID: Date.now(),
                Flags: MESSAGE_FLAGS.FLAG_SENT | MESSAGE_FLAGS.FLAG_RECEIVED,
                Subject: 'Re: polo',
                MIMEType: 'text/plain',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette'],
                Sender: {
                    Address: 'polo@test.com'
                },
                DecryptedBody: USER_SIGNATURE2
            },
            createMessage: (currentMsg) => {
                const match = { Status: 1, Send: 1, ID: 2 };
                mailSettingsMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                mailSettingsMock.DraftMIMEType = 'text/plain';
                return factory.create('reply', currentMsg);
            }
        });

        createMessageTest({
            type: 'A reply message with ReplyTo and no type',
            defaultMessageExtension: {
                Subject: 'polo',
                ToList: ['monique'],
                CCList: ['bobby'],
                BCCList: ['bobette']
            },
            actionConstant: REPLY,
            parseText: true,
            toList: ['monique'],
            ccList: [],
            bccList: [],
            subject: 'Re: ',
            action: 'reply',
            body: defaultReply,
            currentMessageExtension: {
                ID: Date.now(),
                Subject: 'Re: polo',
                MIMEType: 'text/plain',
                ToList: [],
                ReplyTos: ['monique'],
                CCList: ['bobby'],
                BCCList: ['bobette'],
                Sender: {
                    Address: 'polo@test.com'
                },
                DecryptedBody: USER_SIGNATURE2
            },
            createMessage: (currentMsg) => {
                const match = { Status: 1, Send: 1, ID: 2 };
                mailSettingsMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                mailSettingsMock.DraftMIMEType = 'text/plain';
                return factory.create('reply', currentMsg);
            }
        });


        const VALID_MATCH = {
            ID: 1337,
            Status: 1,
            Receive: 1,
            Send: 3,
            Address: 'ecolier@free.fr'
        };

        createMessageTest({
            type: 'A reply message with current AddressID',
            defaultMessageExtension: {
                Subject: 'polo',
                AddressID: 1337,
                ToList: ['bob'],
                CCList: ['bobby@free.fr'],
                BCCList: ['bobette'],
                From: VALID_MATCH
            },
            fromAddress: VALID_MATCH,
            actionConstant: REPLY,
            parseText: false,
            toList: ['bob'],
            ccList: [],
            bccList: [],
            subject: 'Re: ',
            action: 'reply',
            body: defaultReply,
            currentMessageExtension: {
                ID: Date.now(),
                Flags: MESSAGE_FLAGS.FLAG_SENT,
                AddressID: 1337,
                Subject: 'polo',
                ToList: ['bob'],
                CCList: 'bobby@free.fr',
                BCCList: ['bobette'],
                Sender: {
                    Address: 'polo@test.com'
                },
                DecryptedBody: USER_SIGNATURE2
            },
            createMessage: (currentMsg) => {
                const match = { Status: 1, Send: 1, ID: 2 };
                mailSettingsMock.Addresses = [
                    TESTABLE_ADDRESS_DEFAULT,
                    { Status: 2 },
                    match,
                    {
                        Status: 1,
                        Receive: 1,
                        Send: 4,
                        Address: 'paco@free.fr'
                    },
                    VALID_MATCH
                ];
                return factory.create('reply', currentMsg);
            }
        });

        createMessageTest({
            type: 'A reply message with current AddressID and many CCs',
            defaultMessageExtension: {
                Subject: 'polo',
                AddressID: 1337,
                ToList: ['bob'],
                CCList: ['bobby@free.fr'],
                BCCList: ['bobette'],
                From: VALID_MATCH
            },
            fromAddress: VALID_MATCH,
            actionConstant: REPLY,
            parseText: false,
            toList: ['bob'],
            ccList: [],
            bccList: [],
            subject: 'Re: ',
            action: 'reply',
            body: defaultReply,
            currentMessageExtension: {
                ID: Date.now(),
                Flags: MESSAGE_FLAGS.FLAG_SENT,
                AddressID: 1337,
                Subject: 'polo',
                ToList: ['bob'],
                CCList: 'bobby@free.fr',
                BCCList: ['bobette'],
                Sender: {
                    Address: 'polo@test.com'
                },
                DecryptedBody: USER_SIGNATURE2
            },
            createMessage: (currentMsg) => {
                const match = { Status: 1, Send: 1, ID: 2 };
                mailSettingsMock.Addresses = [
                    TESTABLE_ADDRESS_DEFAULT,
                    { Status: 2 },
                    match,
                    {
                        Status: 1,
                        Receive: 1,
                        Send: 4,
                        Address: 'paco@free.fr'
                    },
                    VALID_MATCH
                ];
                return factory.create('reply', currentMsg);
            }
        });


        const VALID_ATTACHMENT = {
            ID: 42,
            Headers: {
                'content-disposition': 'inline'
            }
        };
        createMessageTest({
            type: 'A reply message with attachments',
            defaultMessageExtension: {
                Subject: 'polo',
                AddressID: 1337,
                ToList: ['bob'],
                CCList: ['bobby@free.fr'],
                BCCList: ['bobette'],
                Attachments: [VALID_ATTACHMENT],
                From: VALID_MATCH
            },
            fromAddress: VALID_MATCH,
            actionConstant: REPLY,
            parseText: false,
            toList: ['bob'],
            ccList: [],
            bccList: [],
            subject: 'Re: ',
            action: 'reply',
            body: defaultReply,
            currentMessageExtension: {
                ID: Date.now(),
                Flags: MESSAGE_FLAGS.FLAG_SENT,
                AddressID: 1337,
                Subject: 'polo',
                ToList: ['bob'],
                CCList: 'bobby@free.fr',
                BCCList: ['bobette'],
                Attachments: [
                    {
                        Headers: {},
                        ID: '1664'
                    },
                    VALID_ATTACHMENT
                ],
                Sender: {
                    Address: 'polo@test.com'
                },
                DecryptedBody: USER_SIGNATURE2
            },
            createMessage: (currentMsg) => {
                const match = { Status: 1, Send: 1, ID: 2 };
                mailSettingsMock.Addresses = [
                    TESTABLE_ADDRESS_DEFAULT,
                    { Status: 2 },
                    match,
                    {
                        Status: 1,
                        Receive: 1,
                        Send: 4,
                        Address: 'paco@free.fr'
                    },
                    VALID_MATCH
                ];
                return factory.create('reply', currentMsg);
            }
        });

        createMessageTest({
            type: 'A reply all message',
            defaultMessageExtension: {
                Subject: 'polo',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette']
            },
            actionConstant: REPLY_ALL,
            toList: ['bob'],
            ccList: ['bobby'],
            bccList: ['bobette'],
            subject: 'Re: ',
            action: 'replyall',
            body: defaultReply,
            currentMessageExtension: {
                ID: Date.now(),
                Flags: MESSAGE_FLAGS.FLAG_SENT,
                Subject: 'polo',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette'],
                Sender: {
                    Address: 'polo@test.com'
                },
                DecryptedBody: USER_SIGNATURE2
            },
            createMessage: (currentMsg) => {
                const match = { Status: 1, Send: 1, ID: 2 };
                mailSettingsMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                return factory.create('replyall', currentMsg);
            }
        });

        createMessageTest({
            type: 'A reply all message type 3',
            defaultMessageExtension: {
                Subject: 'polo',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette']
            },
            actionConstant: REPLY_ALL,
            toList: ['bob'],
            ccList: ['bobby'],
            bccList: ['bobette'],
            subject: 'Re: ',
            action: 'replyall',
            body: defaultReply,
            currentMessageExtension: {
                ID: Date.now(),
                Flags: MESSAGE_FLAGS.FLAG_RECEIVED | MESSAGE_FLAGS.FLAG_SENT,
                Subject: 'polo',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette'],
                Sender: {
                    Address: 'polo@test.com'
                },
                DecryptedBody: USER_SIGNATURE2
            },
            createMessage: (currentMsg) => {
                const match = { Status: 1, Send: 1, ID: 2 };
                mailSettingsMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                return factory.create('replyall', currentMsg);
            }
        });

        createMessageTest({
            type: 'A reply all message type ! 2||3',
            defaultMessageExtension: {
                Subject: 'polo',
                ToList: ['monique'],
                CCList: [
                    {
                        Address: 's@mulot.fr'
                    }
                ],
                BCCList: []
            },
            toList: ['monique'],
            ccList: [
                {
                    Address: 's@mulot.fr'
                }
            ],
            bccList: [],
            subject: 'Re: ',
            action: 'replyall',
            actionConstant: REPLY_ALL,
            body: defaultReply,
            currentMessageExtension: {
                ID: Date.now(),
                Subject: 'polo',
                ReplyTos: ['monique'],
                ToList: [],
                CCList: [
                    {
                        Address: 's@mulot.fr'
                    }
                ],
                BCCList: [
                    {
                        Address: 'jean@bob.fr'
                    }
                ],
                Sender: {
                    Address: 'polo@test.com'
                },
                DecryptedBody: USER_SIGNATURE2
            },
            signatureIsAfter: false,
            createMessage(currentMsg) {
                const match = { Status: 1, Send: 1, Email: 'jeanne@free.fr' };
                mailSettingsMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2, Email: 'robert@free.fr' }, match];
                return factory.create('replyall', currentMsg, false);
            }
        });

        createMessageTest({
            type: 'A forward message',
            signatureIsAfter: true,
            defaultMessageExtension: {
                Subject: 'polo',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette']
            },
            actionConstant: FORWARD,
            toList: [],
            ccList: [],
            bccList: [],
            subject: 'Fw: ',
            action: 'forward',
            body: defaultReply,
            currentMessageExtension: {
                ID: Date.now(),
                Flags: MESSAGE_FLAGS.FLAG_SENT,
                Subject: 'polo',
                ToList: ['bob'],
                CCList: ['bobby'],
                BCCList: ['bobette'],
                Sender: {
                    Address: 'polo@test.com'
                },
                DecryptedBody: USER_SIGNATURE2
            },
            createMessage(currentMsg) {
                const match = { Status: 1, Send: 1, ID: 2 };
                mailSettingsMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                return factory.create('forward', currentMsg, true);
            }
        });

        function createMessageTest({ type, createMessage, defaultMessageExtension, currentMessageExtension, action, toList, ccList, bccList, subject, actionConstant, parseText, fromAddress, body = USER_SIGNATURE2, signatureIsAfter }) {
            describe(type, () => {
                let item;
                let currentMsg;
                let DEFAULT_MESSAGE_COPY;

                beforeEach(async () => {
                    spyPrepareContent = jasmine.createSpy();
                    spyLocalReadableTime = jasmine.createSpy();
                    spyGetDecryptedBody = jasmine.createSpy();
                    spySetDecryptedBody = jasmine.createSpy();
                    spyMessageModelMock = jasmine.createSpy();

                    spyOn(signatureBuilder, 'insert').and.returnValue(USER_SIGNATURE);
                    if (currentMessageExtension.MIMEType === 'text/plain') {
                        spyOn(textToHtmlMail, 'parse').and.returnValue(MESSAGE_BODY_PLAIN_ESCAPED);
                        spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_PLAIN);
                    } else {
                        spyOn(textToHtmlMail, 'parse').and.callThrough();
                        spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    }
                    spyOn(sanitize, 'input').and.callFake(_.identity);

                    if (fromAddress) {
                        spyOn(composerFromModel, 'get').and.returnValue({ address: fromAddress });
                    } else {
                        spyOn(composerFromModel, 'get').and.returnValue({ address: DEFAULT_MESSAGE.From });
                    }

                    DEFAULT_MESSAGE_COPY = _.extend({}, DEFAULT_MESSAGE, defaultMessageExtension);
                    currentMsg = _.extend({}, message, currentMessageExtension);

                    item = await createMessage(currentMsg);
                });

                it('should build a new message', () => {
                    expect(spyMessageModelMock).toHaveBeenCalledWith(undefined);
                    expect(spyMessageModelMock).toHaveBeenCalledTimes(1);
                });

                if (parseText) {
                    it('should parse text', () => {
                        expect(textToHtmlMail.parse).toHaveBeenCalledTimes(1);
                        expect(textToHtmlMail.parse).toHaveBeenCalledWith(MESSAGE_BODY_PLAIN);
                    });
                } else {
                    it('should not parse text', () => {
                        expect(textToHtmlMail.parse).not.toHaveBeenCalled();
                    });
                }

                if (action !== 'new') {
                    it('should prepareContent', () => {
                        expect(spyPrepareContent).toHaveBeenCalledTimes(1);
                        const [content, message, options] = spyPrepareContent.calls.argsFor(0);

                        if (currentMessageExtension.MIMEType === 'text/plain') {
                            expect(content).toBe(MESSAGE_BODY_PLAIN_ESCAPED);
                        } else {
                            expect(content).toBe(MESSAGE_BODY);
                        }
                        expect(message.ParentID).toBe(DEFAULT_MESSAGE_COPY.ID);
                        expect(options).toEqual({ blacklist: ['*'], action });
                    });

                    it('should have called the filter localReadableTime ', () => {
                        expect(spyLocalReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                        expect(spyLocalReadableTime).toHaveBeenCalledTimes(1);
                    });

                    it('should read the default message body', () => {
                        expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
                    });

                } else {
                    it('should not have called the filter localReadableTime ', () => {
                        expect(spyLocalReadableTime).not.toHaveBeenCalled();
                    });

                    it('should try to get the default decryptBody of the message', () => {
                        expect(message.getDecryptedBody).not.toHaveBeenCalled();
                    });

                    it('should not have sanitize data ', () => {
                        expect(sanitize.input).not.toHaveBeenCalled();
                    });
                }

                it('should create a new signature', () => {
                    expect(signatureBuilder.insert).toHaveBeenCalled();
                    expect(signatureBuilder.insert).toHaveBeenCalledWith(jasmine.any(Message), { action, isAfter: signatureIsAfter });
                });

                it('should load the sender', () => {
                    expect(composerFromModel.get).toHaveBeenCalledTimes(1);
                    expect(composerFromModel.get).toHaveBeenCalledWith(jasmine.any(Object));
                });

                if (action !== 'new') {
                    it('should add two new keys for this message', () => {
                        const item = signatureBuilder.insert.calls.argsFor(0)[0];
                        const list = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID');
                        const listKeysItem = Object.keys(item);
                        expect(listKeysItem.length).toBe(list.length);
                        expect(_.includes(listKeysItem, 'Action')).toBe(true);
                        expect(_.includes(listKeysItem, 'ParentID')).toBe(true);
                    });
                }

                it('should set a value to Type', () => {
                    expect(item.Type).toBe(DEFAULT_MESSAGE_COPY.Type);
                });

                it('should set a value to ToList', () => {
                    expect(item.ToList).toEqual(toList);
                });

                it('should set a value to CCList', () => {
                    expect(item.CCList).toEqual(ccList);
                });

                it('should set a value to BCCList', () => {
                    expect(item.BCCList).toEqual(bccList);
                });

                it('should set a value to Attachments', () => {
                    expect(item.Attachments).toEqual(DEFAULT_MESSAGE_COPY.Attachments);
                });

                it('should set a value to numTags', () => {
                    expect(item.numTags).toEqual(DEFAULT_MESSAGE_COPY.numTags);
                });

                it('should set a value to recipientFields', () => {
                    expect(item.recipientFields).toEqual(DEFAULT_MESSAGE_COPY.recipientFields);
                });

                it('should set a value to Subject', () => {
                    expect(item.Subject).toBe(`${subject}${DEFAULT_MESSAGE_COPY.Subject}`);
                });

                it('should set a value to PasswordHint', () => {
                    expect(item.PasswordHint).toBe(DEFAULT_MESSAGE_COPY.PasswordHint);
                });

                it('should set a value to ExpirationTime', () => {
                    expect(item.ExpirationTime).toBe(DEFAULT_MESSAGE_COPY.ExpirationTime);
                });

                it('should set a value to ExpiresIn', () => {
                    expect(item.ExpiresIn).toBe(DEFAULT_MESSAGE_COPY.ExpiresIn);
                });

                it('should set a value to From', () => {
                    expect(item.From).toEqual(DEFAULT_MESSAGE_COPY.From);
                });

                it('should set a value to uploading', () => {
                    expect(item.uploading).toBe(DEFAULT_MESSAGE_COPY.uploading);
                });

                it('should set a value to toFocussed', () => {
                    expect(item.toFocussed).toBe(DEFAULT_MESSAGE_COPY.toFocussed);
                });

                it('should set a value to autocompletesFocussed', () => {
                    expect(item.autocompletesFocussed).toBe(DEFAULT_MESSAGE_COPY.autocompletesFocussed);
                });

                it('should set a value to ccbcc', () => {
                    expect(item.ccbcc).toBe(DEFAULT_MESSAGE_COPY.ccbcc);
                });

                it('should set a value to NumEmbedded', () => {
                    expect(item.NumEmbedded).toBe(DEFAULT_MESSAGE_COPY.NumEmbedded);
                });

                it('should set a value to DecryptedBody', () => {
                    expect(item.DecryptedBody).toBe(DEFAULT_MESSAGE_COPY.DecryptedBody);
                });

                if (action !== 'new') {
                    it('should set a value to Action', () => {
                        expect(item.Action).toBe(actionConstant);
                    });

                    it('should set a value to ParentID', () => {
                        expect(item.ParentID).toBe(currentMsg.ID);
                    });

                    it('should set a value ID', () => {
                        expect(item.ID).toBe(undefined);
                    });

                }

                it('should set the decrypted body', () => {
                    expect(spySetDecryptedBody).toHaveBeenCalledWith(USER_SIGNATURE);
                    if (body) {
                        expect(spySetDecryptedBody).toHaveBeenCalledWith(body);
                        expect(spySetDecryptedBody).toHaveBeenCalledTimes(2);
                    }
                });

                if (action !== 'new') {
                    it('should return a new default object', () => {
                        const keysItem = Object.keys(item).sort();
                        const keysDefault = Object.keys(DEFAULT_MESSAGE_COPY)
                            .concat('Action', 'ParentID')
                            .sort();

                        expect(keysItem.length).toBe(keysDefault.length);
                        expect(keysItem).toEqual(keysDefault.sort());
                        expect(_.includes(keysItem, 'Action')).toBe(true);
                        expect(_.includes(keysItem, 'ParentID')).toBe(true);
                    });
                } else {
                    it('should return a new default object', () => {
                        const keysItem = Object.keys(item).sort();
                        const keysDefault = Object.keys(DEFAULT_MESSAGE_COPY);
                        expect(keysItem.length).toBe(keysDefault.length);
                        expect(keysItem).toEqual(keysDefault.sort());
                    });
                }

                it('should return an instance of Message', () => {
                    expect(item.constructor).toMatch(/Message/);
                });
            });
        }
    });

});
