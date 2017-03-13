describe('messageBuilder factory', () => {

    let factory, rootScope, authentication, tools, CONSTANTS, messageModel;
    let signatureBuilder, gettextCatalog;
    let spyUpdateSignature = jasmine.createSpy();
    let spyGetDecryptedBody = jasmine.createSpy();
    let spySetDecryptedBody = jasmine.createSpy();
    let spyMessageModelMock = jasmine.createSpy();
    let spyLocalReadableTime = jasmine.createSpy();
    let spyUtcReadableTime = jasmine.createSpy();
    let spyPrepareContent = jasmine.createSpy();

    let userMock = { Signature: '' };

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

    beforeEach(module('proton.message', 'proton.constants', 'proton.config', 'proton.commons', ($provide) => {
        $provide.factory('authentication', () => ({
            user: userMock
        }));

        $provide.factory('gettextCatalog', () => ({
            getString: _.identity
        }));

        $provide.factory('localReadableTimeFilter', () => (...args) => {
            spyLocalReadableTime(...args);
            return 'localReadableTime';
        });
        $provide.factory('utcReadableTimeFilter', () => (...args) => {
            spyUtcReadableTime(...args);
            return 'utcReadableTime';
        });

        $provide.factory('tools', () => ({
            contactsToString: angular.noop
        }));
        $provide.factory('prepareContent', () => (...args) => {
            spyPrepareContent(...args);
            return 'prepareContent';
        });
        $provide.factory('messageModel', () => messageModelMock);

        $provide.factory('signatureBuilder', () => ({
            insert: angular.noop,
            update(...args) {
                spyUpdateSignature(...args);
            }
        }));
    }));

    beforeEach(inject(($injector) => {
        rootScope = $injector.get('$rootScope');
        CONSTANTS = $injector.get('CONSTANTS');
        tools = $injector.get('tools');
        gettextCatalog = $injector.get('gettextCatalog');
        spyOn(gettextCatalog, 'getString').and.callThrough();

        authentication = $injector.get('authentication');
        signatureBuilder = $injector.get('signatureBuilder');
        messageModel = $injector.get('messageModel');
        factory = $injector.get('messageBuilder');


        DEFAULT_MESSAGE =  {
            Type: CONSTANTS.DRAFT,
            ToList: [],
            CCList: [],
            BCCList: [],
            Attachments: [],
            numTags: [],
            recipientFields: [],
            Subject: "",
            PasswordHint: "",
            IsEncrypted: 0,
            ExpirationTime: 0,
            From: TESTABLE_ADDRESS_DEFAULT,
            uploading: 0,
            toFocussed: false,
            autocompletesFocussed: false,
            ccbcc: false,
            AddressID: 42,
            NumEmbedded: 0,
            DecryptedBody: USER_SIGNATURE
        };

    }));


    describe('Find the sender', () => {

        describe('No addresses no message', () => {

            let output;
            beforeEach(() => {
                userMock.Addresses = [];
                output = factory.findSender();
            });

            it('should return an empty object', () => {
                expect(output).toEqual({});
            });

        });

        describe('No addresses message', () => {

            let output;
            beforeEach(() => {
                userMock.Addresses = [];
                output = factory.findSender({ AddressID: 1 });
            });

            it('should return an empty object', () => {
                expect(output).toEqual({});
            });

        });

        describe('Addresses but no match', () => {

            let output;
            beforeEach(() => {
                userMock.Addresses = [{ Status: 2 }];
                output = factory.findSender({ AddressID: 1 });
            });

            it('should return an empty object', () => {
                expect(output).toEqual({});
            });

        });

        describe('Addresses valid but no match', () => {

            let output;
            const match = { Status: 1, Send: 1, ID: 2 };
            beforeEach(() => {
                userMock.Addresses = [{ Status: 2 }, match, { Status: 1, Send: 2, ID: 3 }];
                output = factory.findSender({ AddressID: 1 });
            });

            it('should return the first address', () => {
                expect(output).toEqual(match);
            });

        });

        describe('Addresses order valid but no match', () => {

            let output;
            const match = { Status: 1, Send: 1, ID: 2 };
            beforeEach(() => {
                userMock.Addresses = [{ Status: 2, ID: 1, Send: 0 }, { Status: 1, Send: 2, ID: 3 }, match];
                output = factory.findSender({ AddressID: 1 });
            });

            it('should return the first address ordered', () => {
                expect(output).toEqual(match);
            });

        });

        describe('Addresses order valid  match', () => {

            let output;
            const match = { Status: 1, Send: 1, ID: 2 };
            const matchMessage = { Status: 1, Send: 2, ID: 1 };
            beforeEach(() => {
                userMock.Addresses = [{ Status: 2 }, matchMessage, match];
                output = factory.findSender({ AddressID: 1 });
            });

            it('should return the matching ID from message', () => {
                expect(output).toEqual(matchMessage);
            });

        });

    });


    describe('Update the signature', () => {

        it('should use the signatureBuilder factory', () => {
            factory.updateSignature('------', 1, 2);
            expect(spyUpdateSignature).toHaveBeenCalledWith('------', 1, 2);
        });

    });

    describe('Create a message', () => {

        describe('A new message from nothing', () => {
            let item;
            const match = { Status: 1, Send: 1, ID: 2 };

            let DEFAULT_MESSAGE_COPY;

            beforeEach(() => {
                spyPrepareContent = jasmine.createSpy();
                spyLocalReadableTime = jasmine.createSpy();
                spyUtcReadableTime = jasmine.createSpy();
                spyGetDecryptedBody = jasmine.createSpy();
                spySetDecryptedBody = jasmine.createSpy();
                spyMessageModelMock = jasmine.createSpy();
                userMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                spyOn(signatureBuilder, 'insert').and.returnValue(USER_SIGNATURE);
                spyOn(tools, 'contactsToString').and.returnValue('');
                spyOn(DOMPurify, 'sanitize').and.callFake(_.identity);

                DEFAULT_MESSAGE_COPY = _.extend({}, DEFAULT_MESSAGE);
                item = factory.create('new');
            });

            it('should build a new message', () => {
                expect(spyMessageModelMock).toHaveBeenCalledWith(undefined);
                expect(spyMessageModelMock).toHaveBeenCalledTimes(1);
            });

            it('should not prepareContent', () => {
                expect(spyPrepareContent).not.toHaveBeenCalled();
            });

            it('should create a new signature', () => {
                expect(signatureBuilder.insert).toHaveBeenCalledTimes(1);
                expect(signatureBuilder.insert).toHaveBeenCalledWith(jasmine.any(Message), { action: 'new' });
                const item = JSON.stringify(signatureBuilder.insert.calls.argsFor(0)[0]);
                expect(item).toEqual(JSON.stringify(DEFAULT_MESSAGE));
            });

            it('should set the decrypted body', () => {
                expect(spySetDecryptedBody).toHaveBeenCalledWith(USER_SIGNATURE);
                expect(spySetDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should return a new default object', () => {
                expect(JSON.stringify(item)).toEqual(JSON.stringify(DEFAULT_MESSAGE));
            });

            it('should return an instance of Message', () => {
                expect(item.constructor).toMatch(/Message/);
            });

            it('should set a value to Type', () => {
                expect(item.Type).toBe(DEFAULT_MESSAGE_COPY.Type);
            });

            it('should set a value to ToList', () => {
                expect(item.ToList).toEqual(DEFAULT_MESSAGE_COPY.ToList);
            });

            it('should set a value to CCList', () => {
                expect(item.CCList).toEqual(DEFAULT_MESSAGE_COPY.CCList);
            });

            it('should set a value to BCCList', () => {
                expect(item.BCCList).toEqual(DEFAULT_MESSAGE_COPY.BCCList);
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
                expect(item.Subject).toBe(DEFAULT_MESSAGE_COPY.Subject);
            });

            it('should set a value to PasswordHint', () => {
                expect(item.PasswordHint).toBe(DEFAULT_MESSAGE_COPY.PasswordHint);
            });

            it('should set a value to IsEncrypted', () => {
                expect(item.IsEncrypted).toBe(DEFAULT_MESSAGE_COPY.IsEncrypted);
            });

            it('should set a value to ExpirationTime', () => {
                expect(item.ExpirationTime).toBe(DEFAULT_MESSAGE_COPY.ExpirationTime);
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

            it('should set a value to AddressID', () => {
                expect(item.AddressID).toBe(DEFAULT_MESSAGE_COPY.AddressID);
            });

            it('should set a value to NumEmbedded', () => {
                expect(item.NumEmbedded).toBe(DEFAULT_MESSAGE_COPY.NumEmbedded);
            });

            it('should set a value to DecryptedBody', () => {
                expect(item.DecryptedBody).toBe(DEFAULT_MESSAGE_COPY.DecryptedBody);
            });

            it('should not have called the filter localReadableTime ', () => {
                expect(spyLocalReadableTime).not.toHaveBeenCalled();
            });

            it('should not have called the filter utcReadableTime ', () => {
                expect(spyUtcReadableTime).not.toHaveBeenCalled();
            });

            it('should not have formated contact as a string ', () => {
                expect(tools.contactsToString).not.toHaveBeenCalled();
            });

            it('should not have sanitize data ', () => {
                expect(DOMPurify.sanitize).not.toHaveBeenCalled();
            });

        });

        describe('A new message from default config', () => {
            let item;
            const match = { Status: 1, Send: 1, ID: 2 };
            let DEFAULT_MESSAGE_COPY;

            beforeEach(() => {
                spyLocalReadableTime = jasmine.createSpy();
                spyUtcReadableTime = jasmine.createSpy();
                spyGetDecryptedBody = jasmine.createSpy();
                spySetDecryptedBody = jasmine.createSpy();
                spyMessageModelMock = jasmine.createSpy();
                userMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                spyOn(signatureBuilder, 'insert').and.returnValue(USER_SIGNATURE);
                spyOn(tools, 'contactsToString').and.returnValue('');
                spyOn(DOMPurify, 'sanitize').and.callFake(_.identity);

                DEFAULT_MESSAGE_COPY = _.extend({}, DEFAULT_MESSAGE, {
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: ['bobby'],
                    BCCList: ['bobette']
                });
                spyOn(message, 'getDecryptedBody').and.returnValue('');
                item = factory.create('new', _.extend({}, message, {
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: ['bobby'],
                    BCCList: ['bobette'],
                    DecryptedBody: USER_SIGNATURE2
                }));
            });

            it('should build a new message', () => {
                expect(spyMessageModelMock).toHaveBeenCalledWith(undefined);
                expect(spyMessageModelMock).toHaveBeenCalledTimes(1);
            });

            it('should create a new signature', () => {
                expect(signatureBuilder.insert).toHaveBeenCalledTimes(1);
                expect(signatureBuilder.insert).toHaveBeenCalledWith(jasmine.any(Message), { action: 'new' });
                const item = signatureBuilder.insert.calls.argsFor(0)[0];
                expect(Object.keys(item).length).toBe(Object.keys(DEFAULT_MESSAGE_COPY).length);
            });

            it('should set a value to Type', () => {
                expect(item.Type).toBe(DEFAULT_MESSAGE_COPY.Type);
            });

            it('should set a value to ToList', () => {
                expect(item.ToList).toEqual(DEFAULT_MESSAGE_COPY.ToList);
            });

            it('should set a value to CCList', () => {
                expect(item.CCList).toEqual(DEFAULT_MESSAGE_COPY.CCList);
            });

            it('should set a value to BCCList', () => {
                expect(item.BCCList).toEqual(DEFAULT_MESSAGE_COPY.BCCList);
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
                expect(item.Subject).toBe(DEFAULT_MESSAGE_COPY.Subject);
            });

            it('should set a value to PasswordHint', () => {
                expect(item.PasswordHint).toBe(DEFAULT_MESSAGE_COPY.PasswordHint);
            });

            it('should set a value to IsEncrypted', () => {
                expect(item.IsEncrypted).toBe(DEFAULT_MESSAGE_COPY.IsEncrypted);
            });

            it('should set a value to ExpirationTime', () => {
                expect(item.ExpirationTime).toBe(DEFAULT_MESSAGE_COPY.ExpirationTime);
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

            it('should set a value to AddressID', () => {
                expect(item.AddressID).toBe(DEFAULT_MESSAGE_COPY.AddressID);
            });

            it('should set a value to NumEmbedded', () => {
                expect(item.NumEmbedded).toBe(DEFAULT_MESSAGE_COPY.NumEmbedded);
            });

            it('should set a value to DecryptedBody', () => {
                expect(item.DecryptedBody).toBe(DEFAULT_MESSAGE_COPY.DecryptedBody);
            });

            it('should set the decrypted body', () => {
                expect(spySetDecryptedBody).toHaveBeenCalledWith(USER_SIGNATURE);
                expect(spySetDecryptedBody).toHaveBeenCalledWith(USER_SIGNATURE2);
                expect(spySetDecryptedBody).toHaveBeenCalledTimes(2);
            });

            it('should return a new default object', () => {
                const keysItem = Object.keys(item).sort();
                const keysDefault = Object.keys(DEFAULT_MESSAGE_COPY).sort();

                expect(keysItem.length).toBe(keysDefault.length);
                expect(keysItem).toEqual(keysDefault.sort());
            });

            it('should return an instance of Message', () => {
                expect(item.constructor).toMatch(/Message/);
            });

            it('should not have called the filter localReadableTime ', () => {
                expect(spyLocalReadableTime).not.toHaveBeenCalled();
            });

            it('should not have called the filter utcReadableTime ', () => {
                expect(spyUtcReadableTime).not.toHaveBeenCalled();
            });

            it('should not have formated contact as a string ', () => {
                expect(tools.contactsToString).not.toHaveBeenCalled();
            });

            it('should try to get the default decryptBody of the message', () => {
                expect(message.getDecryptedBody).not.toHaveBeenCalled();
            });

            it('should not have sanitize data ', () => {
                expect(DOMPurify.sanitize).not.toHaveBeenCalled();
            });
        });



        describe('A reply message', () => {
            let item, currentMsg;
            const match = { Status: 1, Send: 1, ID: 2 };
            let DEFAULT_MESSAGE_COPY;

            const DEFAULT_MESSAGE_REPLY = '<blockquote class="protonmail_quote" type="cite">-------- Original Message --------<br>Subject: polo<br>Local Time: localReadableTime<br>UTC Time: utcReadableTime<br>From: polo@test.com<br>To: <br><br>prepareContent</blockquote><br>';

            beforeEach(() => {
                spyPrepareContent = jasmine.createSpy();
                spyLocalReadableTime = jasmine.createSpy();
                spyUtcReadableTime = jasmine.createSpy();
                spyGetDecryptedBody = jasmine.createSpy();
                spySetDecryptedBody = jasmine.createSpy();
                spyMessageModelMock = jasmine.createSpy();
                userMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                spyOn(signatureBuilder, 'insert').and.returnValue(USER_SIGNATURE);
                spyOn(tools, 'contactsToString').and.returnValue('');
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                spyOn(DOMPurify, 'sanitize').and.callFake(_.identity);

                DEFAULT_MESSAGE_COPY = _.extend({}, DEFAULT_MESSAGE, {
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: ['bobby'],
                    BCCList: ['bobette']
                });
                currentMsg = _.extend({}, message, {
                    ID: Date.now(),
                    Type: 2,
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: ['bobby'],
                    BCCList: ['bobette'],
                    Sender: {
                        Address: 'polo@test.com'
                    },
                    DecryptedBody: USER_SIGNATURE2
                });
                item = factory.create('reply', currentMsg);
            });

            it('should build a new message', () => {
                expect(spyMessageModelMock).toHaveBeenCalledWith(undefined);
                expect(spyMessageModelMock).toHaveBeenCalledTimes(1);
            });


            it('should prepareContent', () => {
                expect(spyPrepareContent).toHaveBeenCalledTimes(1);
                const [ content, message, options ] = spyPrepareContent.calls.argsFor(0);
                expect(content).toBe(MESSAGE_BODY);
                expect(message.ParentID).toBe(DEFAULT_MESSAGE_COPY.ID)
                expect(options).toEqual({ blacklist: ['*'] });
            });

            it('should have called the filter localReadableTime ', () => {
                expect(spyLocalReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyLocalReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have called the filter utcReadableTime ', () => {
                expect(spyUtcReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyUtcReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have formated contact as a string ', () => {
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.CCList);
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.ToList);
                expect(tools.contactsToString).toHaveBeenCalledTimes(2);
            });

            it('should read the default message body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should sanitize data ', () => {
                expect(DOMPurify.sanitize).toHaveBeenCalledWith(`Subject: ${currentMsg.Subject}<br>`);
                expect(DOMPurify.sanitize).toHaveBeenCalledTimes(1);
            });

            it('should create a new signature', () => {
                expect(signatureBuilder.insert).toHaveBeenCalled();
                expect(signatureBuilder.insert).toHaveBeenCalledWith(jasmine.any(Message), { action: 'reply' });
            });

            it('should add two new keys for this message', () => {
                const item = signatureBuilder.insert.calls.argsFor(0)[0];
                const list = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID');
                const listKeysItem = Object.keys(item);
                expect(listKeysItem.length).toBe(list.length);
                expect(_.contains(listKeysItem, 'Action')).toBe(true);
                expect(_.contains(listKeysItem, 'ParentID')).toBe(true);
            });

            it('should set a value to Type', () => {
                expect(item.Type).toBe(DEFAULT_MESSAGE_COPY.Type);
            });

            it('should set a value to ToList', () => {
                expect(item.ToList).toEqual(DEFAULT_MESSAGE_COPY.ToList);
            });

            it('should set a value to CCList', () => {
                expect(item.CCList).toEqual([]);
            });

            it('should set a value to BCCList', () => {
                expect(item.BCCList).toEqual([]);
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
                expect(item.Subject).toBe(`Re: ${DEFAULT_MESSAGE_COPY.Subject}`);
            });

            it('should set a value to PasswordHint', () => {
                expect(item.PasswordHint).toBe(DEFAULT_MESSAGE_COPY.PasswordHint);
            });

            it('should set a value to IsEncrypted', () => {
                expect(item.IsEncrypted).toBe(DEFAULT_MESSAGE_COPY.IsEncrypted);
            });

            it('should set a value to ExpirationTime', () => {
                expect(item.ExpirationTime).toBe(DEFAULT_MESSAGE_COPY.ExpirationTime);
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

            it('should set a value to AddressID', () => {
                expect(item.AddressID).toBe(DEFAULT_MESSAGE_COPY.AddressID);
            });

            it('should set a value to NumEmbedded', () => {
                expect(item.NumEmbedded).toBe(DEFAULT_MESSAGE_COPY.NumEmbedded);
            });

            it('should set a value to DecryptedBody', () => {
                expect(item.DecryptedBody).toBe(DEFAULT_MESSAGE_COPY.DecryptedBody);
            });

            it('should set a value to Action', () => {
                expect(item.Action).toBe(CONSTANTS.REPLY);
            });

            it('should set a value to ParentID', () => {
                expect(item.ParentID).toBe(currentMsg.ID);
            });

            it('should set a value ID', () => {
                expect(item.ID).toBe(undefined);
            });


            it('should set the decrypted body', () => {
                expect(spySetDecryptedBody).toHaveBeenCalledWith(USER_SIGNATURE);
                expect(spySetDecryptedBody).toHaveBeenCalledWith(DEFAULT_MESSAGE_REPLY);
                expect(spySetDecryptedBody).toHaveBeenCalledTimes(2);
            });

            it('should return a new default object', () => {
                const keysItem = Object.keys(item).sort();
                const keysDefault = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID').sort();

                expect(keysItem.length).toBe(keysDefault.length);
                expect(keysItem).toEqual(keysDefault.sort());
                expect(_.contains(keysItem, 'Action')).toBe(true);
                expect(_.contains(keysItem, 'ParentID')).toBe(true);
            });

            it('should return an instance of Message', () => {
                expect(item.constructor).toMatch(/Message/);
            });;

        });

        describe('A reply message with MIMEType and type = 3', () => {
            let item, currentMsg;
            const match = { Status: 1, Send: 1, ID: 2 };
            let DEFAULT_MESSAGE_COPY;
            const DEFAULT_MESSAGE_REPLY = '<blockquote class="protonmail_quote" type="cite">-------- Original Message --------<br>Subject: Re: polo<br>Local Time: localReadableTime<br>UTC Time: utcReadableTime<br>From: polo@test.com<br>To: <br><br>prepareContent</blockquote><br>';

            beforeEach(() => {
                spyPrepareContent = jasmine.createSpy();
                spyLocalReadableTime = jasmine.createSpy();
                spyUtcReadableTime = jasmine.createSpy();
                spyGetDecryptedBody = jasmine.createSpy();
                spySetDecryptedBody = jasmine.createSpy();
                spyMessageModelMock = jasmine.createSpy();
                userMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                spyOn(signatureBuilder, 'insert').and.returnValue(USER_SIGNATURE);
                spyOn(tools, 'contactsToString').and.returnValue('');
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_PLAIN);
                spyOn(DOMPurify, 'sanitize').and.callFake(_.identity);

                DEFAULT_MESSAGE_COPY = _.extend({}, DEFAULT_MESSAGE, {
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: ['bobby'],
                    BCCList: ['bobette']
                });
                currentMsg = _.extend({}, message, {
                    ID: Date.now(),
                    Type: 3,
                    Subject: 'Re: polo',
                    MIMEType: 'text/plain',
                    ToList: ['bob'],
                    CCList: ['bobby'],
                    BCCList: ['bobette'],
                    Sender: {
                        Address: 'polo@test.com'
                    },
                    DecryptedBody: USER_SIGNATURE2
                });
                item = factory.create('reply', currentMsg);
            });

            it('should build a new message', () => {
                expect(spyMessageModelMock).toHaveBeenCalledWith(undefined);
                expect(spyMessageModelMock).toHaveBeenCalledTimes(1);
            });


            it('should prepareContent', () => {
                expect(spyPrepareContent).toHaveBeenCalledTimes(1);
                const [ content, message, options ] = spyPrepareContent.calls.argsFor(0);
                expect(content).toBe(MESSAGE_BODY_PLAIN_ESCAPED);
                expect(message.ParentID).toBe(DEFAULT_MESSAGE_COPY.ID);
                expect(options).toEqual({ blacklist: ['*'] });
            });

            it('should have called the filter localReadableTime ', () => {
                expect(spyLocalReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyLocalReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have called the filter utcReadableTime ', () => {
                expect(spyUtcReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyUtcReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have formated contact as a string ', () => {
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.CCList);
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.ToList);
                expect(tools.contactsToString).toHaveBeenCalledTimes(2);
            });

            it('should read the default message body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should sanitize data ', () => {
                expect(DOMPurify.sanitize).toHaveBeenCalledWith(`Subject: ${currentMsg.Subject}<br>`);
                expect(DOMPurify.sanitize).toHaveBeenCalledTimes(1);
            });

            it('should create a new signature', () => {
                expect(signatureBuilder.insert).toHaveBeenCalled();
                expect(signatureBuilder.insert).toHaveBeenCalledWith(jasmine.any(Message), { action: 'reply' });
            });

            it('should add two new keys for this message', () => {
                const item = signatureBuilder.insert.calls.argsFor(0)[0];
                const list = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID');
                const listKeysItem = Object.keys(item);
                expect(listKeysItem.length).toBe(list.length);
                expect(_.contains(listKeysItem, 'Action')).toBe(true);
                expect(_.contains(listKeysItem, 'ParentID')).toBe(true);
            });

            it('should set a value to Type', () => {
                expect(item.Type).toBe(DEFAULT_MESSAGE_COPY.Type);
            });

            it('should set a value to ToList', () => {
                expect(item.ToList).toEqual(DEFAULT_MESSAGE_COPY.ToList);
            });

            it('should set a value to CCList', () => {
                expect(item.CCList).toEqual([]);
            });

            it('should set a value to BCCList', () => {
                expect(item.BCCList).toEqual([]);
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
                expect(item.Subject).toBe(`Re: ${DEFAULT_MESSAGE_COPY.Subject}`);
            });

            it('should set a value to PasswordHint', () => {
                expect(item.PasswordHint).toBe(DEFAULT_MESSAGE_COPY.PasswordHint);
            });

            it('should set a value to IsEncrypted', () => {
                expect(item.IsEncrypted).toBe(DEFAULT_MESSAGE_COPY.IsEncrypted);
            });

            it('should set a value to ExpirationTime', () => {
                expect(item.ExpirationTime).toBe(DEFAULT_MESSAGE_COPY.ExpirationTime);
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

            it('should set a value to AddressID', () => {
                expect(item.AddressID).toBe(DEFAULT_MESSAGE_COPY.AddressID);
            });

            it('should set a value to NumEmbedded', () => {
                expect(item.NumEmbedded).toBe(DEFAULT_MESSAGE_COPY.NumEmbedded);
            });

            it('should set a value to DecryptedBody', () => {
                expect(item.DecryptedBody).toBe(DEFAULT_MESSAGE_COPY.DecryptedBody);
            });

            it('should set a value to Action', () => {
                expect(item.Action).toBe(CONSTANTS.REPLY);
            });

            it('should set a value to ParentID', () => {
                expect(item.ParentID).toBe(currentMsg.ID);
            });

            it('should set a value ID', () => {
                expect(item.ID).toBe(undefined);
            });


            it('should set the decrypted body', () => {
                expect(spySetDecryptedBody).toHaveBeenCalledWith(USER_SIGNATURE);
                expect(spySetDecryptedBody).toHaveBeenCalledWith(DEFAULT_MESSAGE_REPLY);
                expect(spySetDecryptedBody).toHaveBeenCalledTimes(2);
            });

            it('should return a new default object', () => {
                const keysItem = Object.keys(item).sort();
                const keysDefault = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID').sort();

                expect(keysItem.length).toBe(keysDefault.length);
                expect(keysItem).toEqual(keysDefault.sort());
                expect(_.contains(keysItem, 'Action')).toBe(true);
                expect(_.contains(keysItem, 'ParentID')).toBe(true);
            });

            it('should return an instance of Message', () => {
                expect(item.constructor).toMatch(/Message/);
            });

        });

        describe('A reply message with ReplyTo and no type', () => {
            let item, currentMsg;
            const match = { Status: 1, Send: 1, ID: 2 };
            let DEFAULT_MESSAGE_COPY;
            const DEFAULT_MESSAGE_REPLY = '<blockquote class="protonmail_quote" type="cite">-------- Original Message --------<br>Subject: Re: polo<br>Local Time: localReadableTime<br>UTC Time: utcReadableTime<br>From: polo@test.com<br>To: <br><br>prepareContent</blockquote><br>';

            beforeEach(() => {
                spyPrepareContent = jasmine.createSpy();
                spyLocalReadableTime = jasmine.createSpy();
                spyUtcReadableTime = jasmine.createSpy();
                spyGetDecryptedBody = jasmine.createSpy();
                spySetDecryptedBody = jasmine.createSpy();
                spyMessageModelMock = jasmine.createSpy();
                userMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                spyOn(signatureBuilder, 'insert').and.returnValue(USER_SIGNATURE);
                spyOn(tools, 'contactsToString').and.returnValue('');
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_PLAIN);
                spyOn(DOMPurify, 'sanitize').and.callFake(_.identity);

                DEFAULT_MESSAGE_COPY = _.extend({}, DEFAULT_MESSAGE, {
                    Subject: 'Re: polo',
                    ToList: ['monique'],
                    CCList: ['bobby'],
                    BCCList: ['bobette']
                });
                currentMsg = _.extend({}, message, {
                    ID: Date.now(),
                    Subject: 'Re: polo',
                    MIMEType: 'text/plain',
                    ToList: [],
                    ReplyTo: 'monique',
                    CCList: ['bobby'],
                    BCCList: ['bobette'],
                    Sender: {
                        Address: 'polo@test.com'
                    },
                    DecryptedBody: USER_SIGNATURE2
                });
                item = factory.create('reply', currentMsg);
            });

            it('should build a new message', () => {
                expect(spyMessageModelMock).toHaveBeenCalledWith(undefined);
                expect(spyMessageModelMock).toHaveBeenCalledTimes(1);
            });


            it('should prepareContent', () => {
                expect(spyPrepareContent).toHaveBeenCalledTimes(1);
                const [ content, message, options ] = spyPrepareContent.calls.argsFor(0);
                expect(content).toBe(MESSAGE_BODY_PLAIN_ESCAPED);
                expect(message.ParentID).toBe(DEFAULT_MESSAGE_COPY.ID);
                expect(options).toEqual({ blacklist: ['*'] });
            });

            it('should have called the filter localReadableTime ', () => {
                expect(spyLocalReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyLocalReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have called the filter utcReadableTime ', () => {
                expect(spyUtcReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyUtcReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have formated contact as a string ', () => {
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.CCList);
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.ToList);
                expect(tools.contactsToString).toHaveBeenCalledTimes(2);
            });

            it('should read the default message body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should sanitize data ', () => {
                expect(DOMPurify.sanitize).toHaveBeenCalledWith(`Subject: ${currentMsg.Subject}<br>`);
                expect(DOMPurify.sanitize).toHaveBeenCalledTimes(1);
            });

            it('should create a new signature', () => {
                expect(signatureBuilder.insert).toHaveBeenCalled();
                expect(signatureBuilder.insert).toHaveBeenCalledWith(jasmine.any(Message), { action: 'reply' });
            });

            it('should add two new keys for this message', () => {
                const item = signatureBuilder.insert.calls.argsFor(0)[0];
                const list = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID');
                const listKeysItem = Object.keys(item);
                expect(listKeysItem.length).toBe(list.length);
                expect(_.contains(listKeysItem, 'Action')).toBe(true);
                expect(_.contains(listKeysItem, 'ParentID')).toBe(true);
            });

            it('should set a value to Type', () => {
                expect(item.Type).toBe(DEFAULT_MESSAGE_COPY.Type);
            });

            it('should set a value to ToList', () => {
                expect(item.ToList).toEqual(DEFAULT_MESSAGE_COPY.ToList);
            });

            it('should set a value to CCList', () => {
                expect(item.CCList).toEqual([]);
            });

            it('should set a value to BCCList', () => {
                expect(item.BCCList).toEqual([]);
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
                expect(item.Subject).toBe(DEFAULT_MESSAGE_COPY.Subject);
            });

            it('should set a value to PasswordHint', () => {
                expect(item.PasswordHint).toBe(DEFAULT_MESSAGE_COPY.PasswordHint);
            });

            it('should set a value to IsEncrypted', () => {
                expect(item.IsEncrypted).toBe(DEFAULT_MESSAGE_COPY.IsEncrypted);
            });

            it('should set a value to ExpirationTime', () => {
                expect(item.ExpirationTime).toBe(DEFAULT_MESSAGE_COPY.ExpirationTime);
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

            it('should set a value to AddressID', () => {
                expect(item.AddressID).toBe(DEFAULT_MESSAGE_COPY.AddressID);
            });

            it('should set a value to NumEmbedded', () => {
                expect(item.NumEmbedded).toBe(DEFAULT_MESSAGE_COPY.NumEmbedded);
            });

            it('should set a value to DecryptedBody', () => {
                expect(item.DecryptedBody).toBe(DEFAULT_MESSAGE_COPY.DecryptedBody);
            });

            it('should set a value to Action', () => {
                expect(item.Action).toBe(CONSTANTS.REPLY);
            });

            it('should set a value to ParentID', () => {
                expect(item.ParentID).toBe(currentMsg.ID);
            });

            it('should set a value ID', () => {
                expect(item.ID).toBe(undefined);
            });


            it('should set the decrypted body', () => {
                expect(spySetDecryptedBody).toHaveBeenCalledWith(USER_SIGNATURE);
                expect(spySetDecryptedBody).toHaveBeenCalledWith(DEFAULT_MESSAGE_REPLY);
                expect(spySetDecryptedBody).toHaveBeenCalledTimes(2);
            });

            it('should return a new default object', () => {
                const keysItem = Object.keys(item).sort();
                const keysDefault = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID').sort();

                expect(keysItem.length).toBe(keysDefault.length);
                expect(keysItem).toEqual(keysDefault.sort());
                expect(_.contains(keysItem, 'Action')).toBe(true);
                expect(_.contains(keysItem, 'ParentID')).toBe(true);
            });

            it('should return an instance of Message', () => {
                expect(item.constructor).toMatch(/Message/);
            });

        });

        describe('A reply message with current AddressID', () => {
            let item, currentMsg;
            const match = { Status: 1, Send: 1, ID: 2 };
            let DEFAULT_MESSAGE_COPY;
            const VALID_MATCH = {
                ID: 1337,
                Status: 1,
                Receive: 1,
                Send: 3,
                Address: 'ecolier@free.fr'
            };

            const DEFAULT_MESSAGE_REPLY = '<blockquote class="protonmail_quote" type="cite">-------- Original Message --------<br>Subject: polo<br>Local Time: localReadableTime<br>UTC Time: utcReadableTime<br>From: polo@test.com<br>To: <br><br>prepareContent</blockquote><br>';

            beforeEach(() => {
                spyPrepareContent = jasmine.createSpy();
                spyLocalReadableTime = jasmine.createSpy();
                spyUtcReadableTime = jasmine.createSpy();
                spyGetDecryptedBody = jasmine.createSpy();
                spySetDecryptedBody = jasmine.createSpy();
                spyMessageModelMock = jasmine.createSpy();
                userMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match, {
                    Status: 1,
                    Receive: 1,
                    Send: 4,
                    Address: 'paco@free.fr'
                }, VALID_MATCH];
                spyOn(signatureBuilder, 'insert').and.returnValue(USER_SIGNATURE);
                spyOn(tools, 'contactsToString').and.returnValue('');
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                spyOn(DOMPurify, 'sanitize').and.callFake(_.identity);

                DEFAULT_MESSAGE_COPY = _.extend({}, DEFAULT_MESSAGE, {
                    Subject: 'polo',
                    AddressID: 1337,
                    ToList: ['bob'],
                    CCList: ['bobby@free.fr'],
                    BCCList: ['bobette'],
                    From: VALID_MATCH
                });
                currentMsg = _.extend({}, message, {
                    ID: Date.now(),
                    Type: 2,
                    AddressID: 1337,
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: 'bobby@free.fr',
                    BCCList: ['bobette'],
                    Sender: {
                        Address: 'polo@test.com'
                    },
                    DecryptedBody: USER_SIGNATURE2
                });
                item = factory.create('reply', currentMsg);
            });

            it('should build a new message', () => {
                expect(spyMessageModelMock).toHaveBeenCalledWith(undefined);
                expect(spyMessageModelMock).toHaveBeenCalledTimes(1);
            });


            it('should prepareContent', () => {
                expect(spyPrepareContent).toHaveBeenCalledTimes(1);
                const [ content, message, options ] = spyPrepareContent.calls.argsFor(0);
                expect(content).toBe(MESSAGE_BODY);
                expect(message.ParentID).toBe(DEFAULT_MESSAGE_COPY.ID);
                expect(options).toEqual({ blacklist: ['*'] });
            });

            it('should have called the filter localReadableTime ', () => {
                expect(spyLocalReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyLocalReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have called the filter utcReadableTime ', () => {
                expect(spyUtcReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyUtcReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have formated contact as a string ', () => {
                expect(tools.contactsToString).toHaveBeenCalledWith([currentMsg.CCList]);
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.ToList);
                expect(tools.contactsToString).toHaveBeenCalledTimes(2);
            });

            it('should read the default message body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should sanitize data ', () => {
                expect(DOMPurify.sanitize).toHaveBeenCalledWith(`Subject: ${currentMsg.Subject}<br>`);
                expect(DOMPurify.sanitize).toHaveBeenCalledTimes(1);
            });

            it('should create a new signature', () => {
                expect(signatureBuilder.insert).toHaveBeenCalled();
                expect(signatureBuilder.insert).toHaveBeenCalledWith(jasmine.any(Message), { action: 'reply' });
            });

            it('should add two new keys for this message', () => {
                const item = signatureBuilder.insert.calls.argsFor(0)[0];
                const list = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID');
                const listKeysItem = Object.keys(item);
                expect(listKeysItem.length).toBe(list.length);
                expect(_.contains(listKeysItem, 'Action')).toBe(true);
                expect(_.contains(listKeysItem, 'ParentID')).toBe(true);
            });

            it('should set a value to Type', () => {
                expect(item.Type).toBe(DEFAULT_MESSAGE_COPY.Type);
            });

            it('should set a value to ToList', () => {
                expect(item.ToList).toEqual(DEFAULT_MESSAGE_COPY.ToList);
            });

            it('should set a value to CCList', () => {
                expect(item.CCList).toEqual([]);
            });

            it('should set a value to BCCList', () => {
                expect(item.BCCList).toEqual([]);
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
                expect(item.Subject).toBe(`Re: ${DEFAULT_MESSAGE_COPY.Subject}`);
            });

            it('should set a value to PasswordHint', () => {
                expect(item.PasswordHint).toBe(DEFAULT_MESSAGE_COPY.PasswordHint);
            });

            it('should set a value to IsEncrypted', () => {
                expect(item.IsEncrypted).toBe(DEFAULT_MESSAGE_COPY.IsEncrypted);
            });

            it('should set a value to ExpirationTime', () => {
                expect(item.ExpirationTime).toBe(DEFAULT_MESSAGE_COPY.ExpirationTime);
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

            it('should set a value to AddressID', () => {
                expect(item.AddressID).toBe(DEFAULT_MESSAGE_COPY.AddressID);
            });

            it('should set a value to NumEmbedded', () => {
                expect(item.NumEmbedded).toBe(DEFAULT_MESSAGE_COPY.NumEmbedded);
            });

            it('should set a value to DecryptedBody', () => {
                expect(item.DecryptedBody).toBe(DEFAULT_MESSAGE_COPY.DecryptedBody);
            });

            it('should set a value to Action', () => {
                expect(item.Action).toBe(CONSTANTS.REPLY);
            });

            it('should set a value to ParentID', () => {
                expect(item.ParentID).toBe(currentMsg.ID);
            });

            it('should set a value ID', () => {
                expect(item.ID).toBe(undefined);
            });


            it('should set the decrypted body', () => {
                expect(spySetDecryptedBody).toHaveBeenCalledWith(USER_SIGNATURE);
                expect(spySetDecryptedBody).toHaveBeenCalledWith(DEFAULT_MESSAGE_REPLY);
                expect(spySetDecryptedBody).toHaveBeenCalledTimes(2);
            });

            it('should return a new default object', () => {
                const keysItem = Object.keys(item).sort();
                const keysDefault = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID').sort();

                expect(keysItem.length).toBe(keysDefault.length);
                expect(keysItem).toEqual(keysDefault.sort());
                expect(_.contains(keysItem, 'Action')).toBe(true);
                expect(_.contains(keysItem, 'ParentID')).toBe(true);
            });

            it('should return an instance of Message', () => {
                expect(item.constructor).toMatch(/Message/);
            });

        });

        describe('A reply message with current AddressID and many CCs', () => {
            let item, currentMsg;
            const match = { Status: 1, Send: 1, ID: 2 };
            let DEFAULT_MESSAGE_COPY;
            const VALID_MATCH = {
                ID: 1337,
                Status: 1,
                Receive: 1,
                Send: 3,
                Address: 'ecolier@free.fr'
            };

            const DEFAULT_MESSAGE_REPLY = '<blockquote class="protonmail_quote" type="cite">-------- Original Message --------<br>Subject: polo<br>Local Time: localReadableTime<br>UTC Time: utcReadableTime<br>From: polo@test.com<br>To: ashes2ashes@dust2dust.earth<br>ashes2ashes@dust2dust.earth<br><br>prepareContent</blockquote><br>';

            beforeEach(() => {
                spyPrepareContent = jasmine.createSpy();
                spyLocalReadableTime = jasmine.createSpy();
                spyUtcReadableTime = jasmine.createSpy();
                spyGetDecryptedBody = jasmine.createSpy();
                spySetDecryptedBody = jasmine.createSpy();
                spyMessageModelMock = jasmine.createSpy();
                userMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match, {
                    Status: 1,
                    Receive: 1,
                    Send: 4,
                    Address: 'paco@free.fr'
                }, VALID_MATCH];
                spyOn(signatureBuilder, 'insert').and.returnValue(USER_SIGNATURE);
                spyOn(tools, 'contactsToString').and.returnValue('ashes2ashes@dust2dust.earth');
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                spyOn(DOMPurify, 'sanitize').and.callFake(_.identity);

                DEFAULT_MESSAGE_COPY = _.extend({}, DEFAULT_MESSAGE, {
                    Subject: 'polo',
                    AddressID: 1337,
                    ToList: ['bob'],
                    CCList: ['bobby@free.fr'],
                    BCCList: ['bobette'],
                    From: VALID_MATCH
                });
                currentMsg = _.extend({}, message, {
                    ID: Date.now(),
                    Type: 2,
                    AddressID: 1337,
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: 'bobby@free.fr',
                    BCCList: ['bobette'],
                    Sender: {
                        Address: 'polo@test.com'
                    },
                    DecryptedBody: USER_SIGNATURE2
                });
                item = factory.create('reply', currentMsg);
            });

            it('should build a new message', () => {
                expect(spyMessageModelMock).toHaveBeenCalledWith(undefined);
                expect(spyMessageModelMock).toHaveBeenCalledTimes(1);
            });


            it('should prepareContent', () => {
                expect(spyPrepareContent).toHaveBeenCalledTimes(1);
                const [ content, message, options ] = spyPrepareContent.calls.argsFor(0);
                expect(content).toBe(MESSAGE_BODY);
                expect(message.ParentID).toBe(DEFAULT_MESSAGE_COPY.ID);
                expect(options).toEqual({ blacklist: ['*'] });
            });

            it('should have called the filter localReadableTime ', () => {
                expect(spyLocalReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyLocalReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have called the filter utcReadableTime ', () => {
                expect(spyUtcReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyUtcReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have formated contact as a string ', () => {
                expect(tools.contactsToString).toHaveBeenCalledWith([currentMsg.CCList]);
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.ToList);
                expect(tools.contactsToString).toHaveBeenCalledTimes(2);
            });

            it('should read the default message body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should sanitize data ', () => {
                expect(DOMPurify.sanitize).toHaveBeenCalledWith(`Subject: ${currentMsg.Subject}<br>`);
                expect(DOMPurify.sanitize).toHaveBeenCalledTimes(1);
            });

            it('should create a new signature', () => {
                expect(signatureBuilder.insert).toHaveBeenCalled();
                expect(signatureBuilder.insert).toHaveBeenCalledWith(jasmine.any(Message), { action: 'reply' });
            });

            it('should add two new keys for this message', () => {
                const item = signatureBuilder.insert.calls.argsFor(0)[0];
                const list = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID');
                const listKeysItem = Object.keys(item);
                expect(listKeysItem.length).toBe(list.length);
                expect(_.contains(listKeysItem, 'Action')).toBe(true);
                expect(_.contains(listKeysItem, 'ParentID')).toBe(true);
            });

            it('should set a value to Type', () => {
                expect(item.Type).toBe(DEFAULT_MESSAGE_COPY.Type);
            });

            it('should set a value to ToList', () => {
                expect(item.ToList).toEqual(DEFAULT_MESSAGE_COPY.ToList);
            });

            it('should set a value to CCList', () => {
                expect(item.CCList).toEqual([]);
            });

            it('should set a value to BCCList', () => {
                expect(item.BCCList).toEqual([]);
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
                expect(item.Subject).toBe(`Re: ${DEFAULT_MESSAGE_COPY.Subject}`);
            });

            it('should set a value to PasswordHint', () => {
                expect(item.PasswordHint).toBe(DEFAULT_MESSAGE_COPY.PasswordHint);
            });

            it('should set a value to IsEncrypted', () => {
                expect(item.IsEncrypted).toBe(DEFAULT_MESSAGE_COPY.IsEncrypted);
            });

            it('should set a value to ExpirationTime', () => {
                expect(item.ExpirationTime).toBe(DEFAULT_MESSAGE_COPY.ExpirationTime);
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

            it('should set a value to AddressID', () => {
                expect(item.AddressID).toBe(DEFAULT_MESSAGE_COPY.AddressID);
            });

            it('should set a value to NumEmbedded', () => {
                expect(item.NumEmbedded).toBe(DEFAULT_MESSAGE_COPY.NumEmbedded);
            });

            it('should set a value to DecryptedBody', () => {
                expect(item.DecryptedBody).toBe(DEFAULT_MESSAGE_COPY.DecryptedBody);
            });

            it('should set a value to Action', () => {
                expect(item.Action).toBe(CONSTANTS.REPLY);
            });

            it('should set a value to ParentID', () => {
                expect(item.ParentID).toBe(currentMsg.ID);
            });

            it('should set a value ID', () => {
                expect(item.ID).toBe(undefined);
            });


            it('should set the decrypted body', () => {
                expect(spySetDecryptedBody).toHaveBeenCalledWith(USER_SIGNATURE);
                expect(spySetDecryptedBody).toHaveBeenCalledWith(DEFAULT_MESSAGE_REPLY);
                expect(spySetDecryptedBody).toHaveBeenCalledTimes(2);
            });

            it('should return a new default object', () => {
                const keysItem = Object.keys(item).sort();
                const keysDefault = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID').sort();

                expect(keysItem.length).toBe(keysDefault.length);
                expect(keysItem).toEqual(keysDefault.sort());
                expect(_.contains(keysItem, 'Action')).toBe(true);
                expect(_.contains(keysItem, 'ParentID')).toBe(true);
            });

            it('should return an instance of Message', () => {
                expect(item.constructor).toMatch(/Message/);
            });

        });


        describe('A reply message with attachements', () => {
            let item, currentMsg;
            const match = { Status: 1, Send: 1, ID: 2 };
            let DEFAULT_MESSAGE_COPY;

            const DEFAULT_MESSAGE_REPLY = '<blockquote class="protonmail_quote" type="cite">-------- Original Message --------<br>Subject: polo<br>Local Time: localReadableTime<br>UTC Time: utcReadableTime<br>From: polo@test.com<br>To: <br><br>prepareContent</blockquote><br>';

            const VALID_ATTACHMENT = {
                ID: 42,
                Headers: {
                    'content-disposition': 'inline'
                }
            };
            beforeEach(() => {
                spyPrepareContent = jasmine.createSpy();
                spyLocalReadableTime = jasmine.createSpy();
                spyUtcReadableTime = jasmine.createSpy();
                spyGetDecryptedBody = jasmine.createSpy();
                spySetDecryptedBody = jasmine.createSpy();
                spyMessageModelMock = jasmine.createSpy();
                userMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                spyOn(signatureBuilder, 'insert').and.returnValue(USER_SIGNATURE);
                spyOn(tools, 'contactsToString').and.returnValue('');
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                spyOn(DOMPurify, 'sanitize').and.callFake(_.identity);

                DEFAULT_MESSAGE_COPY = _.extend({}, DEFAULT_MESSAGE, {
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: ['bobby'],
                    BCCList: ['bobette'],
                    Attachments: [VALID_ATTACHMENT]
                });
                currentMsg = _.extend({}, message, {
                    ID: Date.now(),
                    Type: 2,
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: ['bobby'],
                    BCCList: ['bobette'],
                    Attachments: [{
                        Headers: {},
                        ID: '1664'
                    }, VALID_ATTACHMENT ],
                    Sender: {
                        Address: 'polo@test.com'
                    },
                    DecryptedBody: USER_SIGNATURE2
                });
                item = factory.create('reply', currentMsg);
            });

            it('should build a new message', () => {
                expect(spyMessageModelMock).toHaveBeenCalledWith(undefined);
                expect(spyMessageModelMock).toHaveBeenCalledTimes(1);
            });


            it('should prepareContent', () => {
                expect(spyPrepareContent).toHaveBeenCalledTimes(1);
                const [ content, message, options ] = spyPrepareContent.calls.argsFor(0);
                expect(content).toBe(MESSAGE_BODY);
                expect(message.ParentID).toBe(DEFAULT_MESSAGE_COPY.ID)
                expect(options).toEqual({ blacklist: ['*'] });
            });

            it('should have called the filter localReadableTime ', () => {
                expect(spyLocalReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyLocalReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have called the filter utcReadableTime ', () => {
                expect(spyUtcReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyUtcReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have formated contact as a string ', () => {
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.CCList);
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.ToList);
                expect(tools.contactsToString).toHaveBeenCalledTimes(2);
            });

            it('should read the default message body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should sanitize data ', () => {
                expect(DOMPurify.sanitize).toHaveBeenCalledWith(`Subject: ${currentMsg.Subject}<br>`);
                expect(DOMPurify.sanitize).toHaveBeenCalledTimes(1);
            });

            it('should create a new signature', () => {
                expect(signatureBuilder.insert).toHaveBeenCalled();
                expect(signatureBuilder.insert).toHaveBeenCalledWith(jasmine.any(Message), { action: 'reply' });
            });

            it('should add two new keys for this message', () => {
                const item = signatureBuilder.insert.calls.argsFor(0)[0];
                const list = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID');
                const listKeysItem = Object.keys(item);
                expect(listKeysItem.length).toBe(list.length);
                expect(_.contains(listKeysItem, 'Action')).toBe(true);
                expect(_.contains(listKeysItem, 'ParentID')).toBe(true);
            });

            it('should set a value to Type', () => {
                expect(item.Type).toBe(DEFAULT_MESSAGE_COPY.Type);
            });

            it('should set a value to ToList', () => {
                expect(item.ToList).toEqual(DEFAULT_MESSAGE_COPY.ToList);
            });

            it('should set a value to CCList', () => {
                expect(item.CCList).toEqual([]);
            });

            it('should set a value to BCCList', () => {
                expect(item.BCCList).toEqual([]);
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
                expect(item.Subject).toBe(`Re: ${DEFAULT_MESSAGE_COPY.Subject}`);
            });

            it('should set a value to PasswordHint', () => {
                expect(item.PasswordHint).toBe(DEFAULT_MESSAGE_COPY.PasswordHint);
            });

            it('should set a value to IsEncrypted', () => {
                expect(item.IsEncrypted).toBe(DEFAULT_MESSAGE_COPY.IsEncrypted);
            });

            it('should set a value to ExpirationTime', () => {
                expect(item.ExpirationTime).toBe(DEFAULT_MESSAGE_COPY.ExpirationTime);
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

            it('should set a value to AddressID', () => {
                expect(item.AddressID).toBe(DEFAULT_MESSAGE_COPY.AddressID);
            });

            it('should set a value to NumEmbedded', () => {
                expect(item.NumEmbedded).toBe(DEFAULT_MESSAGE_COPY.NumEmbedded);
            });

            it('should set a value to DecryptedBody', () => {
                expect(item.DecryptedBody).toBe(DEFAULT_MESSAGE_COPY.DecryptedBody);
            });

            it('should set a value to Action', () => {
                expect(item.Action).toBe(CONSTANTS.REPLY);
            });

            it('should set a value to ParentID', () => {
                expect(item.ParentID).toBe(currentMsg.ID);
            });

            it('should set a value ID', () => {
                expect(item.ID).toBe(undefined);
            });


            it('should set the decrypted body', () => {
                expect(spySetDecryptedBody).toHaveBeenCalledWith(USER_SIGNATURE);
                expect(spySetDecryptedBody).toHaveBeenCalledWith(DEFAULT_MESSAGE_REPLY);
                expect(spySetDecryptedBody).toHaveBeenCalledTimes(2);
            });

            it('should return a new default object', () => {
                const keysItem = Object.keys(item).sort();
                const keysDefault = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID').sort();

                expect(keysItem.length).toBe(keysDefault.length);
                expect(keysItem).toEqual(keysDefault.sort());
                expect(_.contains(keysItem, 'Action')).toBe(true);
                expect(_.contains(keysItem, 'ParentID')).toBe(true);
            });

            it('should return an instance of Message', () => {
                expect(item.constructor).toMatch(/Message/);
            });;

        });


        describe('A reply all message', () => {
            let item, currentMsg;
            const match = { Status: 1, Send: 1, ID: 2 };
            let DEFAULT_MESSAGE_COPY;

            const DEFAULT_MESSAGE_REPLY = '<blockquote class="protonmail_quote" type="cite">-------- Original Message --------<br>Subject: polo<br>Local Time: localReadableTime<br>UTC Time: utcReadableTime<br>From: polo@test.com<br>To: <br><br>prepareContent</blockquote><br>';

            beforeEach(() => {
                spyPrepareContent = jasmine.createSpy();
                spyLocalReadableTime = jasmine.createSpy();
                spyUtcReadableTime = jasmine.createSpy();
                spyGetDecryptedBody = jasmine.createSpy();
                spySetDecryptedBody = jasmine.createSpy();
                spyMessageModelMock = jasmine.createSpy();
                userMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                spyOn(signatureBuilder, 'insert').and.returnValue(USER_SIGNATURE);
                spyOn(tools, 'contactsToString').and.returnValue('');
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                spyOn(DOMPurify, 'sanitize').and.callFake(_.identity);

                DEFAULT_MESSAGE_COPY = _.extend({}, DEFAULT_MESSAGE, {
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: ['bobby'],
                    BCCList: ['bobette']
                });
                currentMsg = _.extend({}, message, {
                    ID: Date.now(),
                    Type: 2,
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: ['bobby'],
                    BCCList: ['bobette'],
                    Sender: {
                        Address: 'polo@test.com'
                    },
                    DecryptedBody: USER_SIGNATURE2
                });
                item = factory.create('replyall', currentMsg);
            });

            it('should build a new message', () => {
                expect(spyMessageModelMock).toHaveBeenCalledWith(undefined);
                expect(spyMessageModelMock).toHaveBeenCalledTimes(1);
            });

            it('should prepareContent', () => {
                expect(spyPrepareContent).toHaveBeenCalledTimes(1);
                const [ content, message, options ] = spyPrepareContent.calls.argsFor(0);
                expect(content).toBe(MESSAGE_BODY);
                expect(message.ParentID).toBe(DEFAULT_MESSAGE_COPY.ID);
                expect(options).toEqual({ blacklist: ['*'] });
            });

            it('should have called the filter localReadableTime ', () => {
                expect(spyLocalReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyLocalReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have called the filter utcReadableTime ', () => {
                expect(spyUtcReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyUtcReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have formated contact as a string ', () => {
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.CCList);
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.ToList);
                expect(tools.contactsToString).toHaveBeenCalledTimes(2);
            });

            it('should read the default message body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should sanitize data ', () => {
                expect(DOMPurify.sanitize).toHaveBeenCalledWith(`Subject: ${currentMsg.Subject}<br>`);
                expect(DOMPurify.sanitize).toHaveBeenCalledTimes(1);
            });

            it('should create a new signature', () => {
                expect(signatureBuilder.insert).toHaveBeenCalled();
                expect(signatureBuilder.insert).toHaveBeenCalledWith(jasmine.any(Message), { action: 'replyall' });
            });

            it('should add two new keys for this message', () => {
                const item = signatureBuilder.insert.calls.argsFor(0)[0];
                const list = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID');
                const listKeysItem = Object.keys(item);
                expect(listKeysItem.length).toBe(list.length);
                expect(_.contains(listKeysItem, 'Action')).toBe(true);
                expect(_.contains(listKeysItem, 'ParentID')).toBe(true);
            });

            it('should set a value to Type', () => {
                expect(item.Type).toBe(DEFAULT_MESSAGE_COPY.Type);
            });

            it('should set a value to ToList', () => {
                expect(item.ToList).toEqual(DEFAULT_MESSAGE_COPY.ToList);
            });

            it('should set a value to CCList', () => {
                expect(item.CCList).toEqual(DEFAULT_MESSAGE_COPY.CCList);
            });

            it('should set a value to BCCList', () => {
                expect(item.BCCList).toEqual(DEFAULT_MESSAGE_COPY.BCCList);
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
                expect(item.Subject).toBe(`Re: ${DEFAULT_MESSAGE_COPY.Subject}`);
            });

            it('should set a value to PasswordHint', () => {
                expect(item.PasswordHint).toBe(DEFAULT_MESSAGE_COPY.PasswordHint);
            });

            it('should set a value to IsEncrypted', () => {
                expect(item.IsEncrypted).toBe(DEFAULT_MESSAGE_COPY.IsEncrypted);
            });

            it('should set a value to ExpirationTime', () => {
                expect(item.ExpirationTime).toBe(DEFAULT_MESSAGE_COPY.ExpirationTime);
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

            it('should set a value to AddressID', () => {
                expect(item.AddressID).toBe(DEFAULT_MESSAGE_COPY.AddressID);
            });

            it('should set a value to NumEmbedded', () => {
                expect(item.NumEmbedded).toBe(DEFAULT_MESSAGE_COPY.NumEmbedded);
            });

            it('should set a value to DecryptedBody', () => {
                expect(item.DecryptedBody).toBe(DEFAULT_MESSAGE_COPY.DecryptedBody);
            });

            it('should set a value to Action', () => {
                expect(item.Action).toBe(CONSTANTS.REPLY_ALL);
            });

            it('should set a value to ParentID', () => {
                expect(item.ParentID).toBe(currentMsg.ID);
            });

            it('should set a value ID', () => {
                expect(item.ID).toBe(undefined);
            });


            it('should set the decrypted body', () => {
                expect(spySetDecryptedBody).toHaveBeenCalledWith(USER_SIGNATURE);
                expect(spySetDecryptedBody).toHaveBeenCalledWith(DEFAULT_MESSAGE_REPLY);
                expect(spySetDecryptedBody).toHaveBeenCalledTimes(2);
            });

            it('should return a new default object', () => {
                const keysItem = Object.keys(item).sort();
                const keysDefault = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID').sort();

                expect(keysItem.length).toBe(keysDefault.length);
                expect(keysItem).toEqual(keysDefault.sort());
                expect(_.contains(keysItem, 'Action')).toBe(true);
                expect(_.contains(keysItem, 'ParentID')).toBe(true);
            });

            it('should return an instance of Message', () => {
                expect(item.constructor).toMatch(/Message/);
            });

        });

        describe('A reply all message type 3', () => {
            let item, currentMsg;
            const match = { Status: 1, Send: 1, ID: 2 };
            let DEFAULT_MESSAGE_COPY;

            const DEFAULT_MESSAGE_REPLY = '<blockquote class="protonmail_quote" type="cite">-------- Original Message --------<br>Subject: polo<br>Local Time: localReadableTime<br>UTC Time: utcReadableTime<br>From: polo@test.com<br>To: <br><br>prepareContent</blockquote><br>';

            beforeEach(() => {
                spyPrepareContent = jasmine.createSpy();
                spyLocalReadableTime = jasmine.createSpy();
                spyUtcReadableTime = jasmine.createSpy();
                spyGetDecryptedBody = jasmine.createSpy();
                spySetDecryptedBody = jasmine.createSpy();
                spyMessageModelMock = jasmine.createSpy();
                userMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                spyOn(signatureBuilder, 'insert').and.returnValue(USER_SIGNATURE);
                spyOn(tools, 'contactsToString').and.returnValue('');
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                spyOn(DOMPurify, 'sanitize').and.callFake(_.identity);

                DEFAULT_MESSAGE_COPY = _.extend({}, DEFAULT_MESSAGE, {
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: ['bobby'],
                    BCCList: ['bobette']
                });
                currentMsg = _.extend({}, message, {
                    ID: Date.now(),
                    Type: 3,
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: ['bobby'],
                    BCCList: ['bobette'],
                    Sender: {
                        Address: 'polo@test.com'
                    },
                    DecryptedBody: USER_SIGNATURE2
                });
                item = factory.create('replyall', currentMsg);
            });

            it('should build a new message', () => {
                expect(spyMessageModelMock).toHaveBeenCalledWith(undefined);
                expect(spyMessageModelMock).toHaveBeenCalledTimes(1);
            });

            it('should prepareContent', () => {
                expect(spyPrepareContent).toHaveBeenCalledTimes(1);
                const [ content, message, options ] = spyPrepareContent.calls.argsFor(0);
                expect(content).toBe(MESSAGE_BODY);
                expect(message.ParentID).toBe(DEFAULT_MESSAGE_COPY.ID);
                expect(options).toEqual({ blacklist: ['*'] });
            });

            it('should have called the filter localReadableTime ', () => {
                expect(spyLocalReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyLocalReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have called the filter utcReadableTime ', () => {
                expect(spyUtcReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyUtcReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have formated contact as a string ', () => {
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.CCList);
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.ToList);
                expect(tools.contactsToString).toHaveBeenCalledTimes(2);
            });

            it('should read the default message body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should sanitize data ', () => {
                expect(DOMPurify.sanitize).toHaveBeenCalledWith(`Subject: ${currentMsg.Subject}<br>`);
                expect(DOMPurify.sanitize).toHaveBeenCalledTimes(1);
            });

            it('should create a new signature', () => {
                expect(signatureBuilder.insert).toHaveBeenCalled();
                expect(signatureBuilder.insert).toHaveBeenCalledWith(jasmine.any(Message), { action: 'replyall' });
            });

            it('should add two new keys for this message', () => {
                const item = signatureBuilder.insert.calls.argsFor(0)[0];
                const list = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID');
                const listKeysItem = Object.keys(item);
                expect(listKeysItem.length).toBe(list.length);
                expect(_.contains(listKeysItem, 'Action')).toBe(true);
                expect(_.contains(listKeysItem, 'ParentID')).toBe(true);
            });

            it('should set a value to Type', () => {
                expect(item.Type).toBe(DEFAULT_MESSAGE_COPY.Type);
            });

            it('should set a value to ToList', () => {
                expect(item.ToList).toEqual(DEFAULT_MESSAGE_COPY.ToList);
            });

            it('should set a value to CCList', () => {
                expect(item.CCList).toEqual(DEFAULT_MESSAGE_COPY.CCList);
            });

            it('should set a value to BCCList', () => {
                expect(item.BCCList).toEqual(DEFAULT_MESSAGE_COPY.BCCList);
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
                expect(item.Subject).toBe(`Re: ${DEFAULT_MESSAGE_COPY.Subject}`);
            });

            it('should set a value to PasswordHint', () => {
                expect(item.PasswordHint).toBe(DEFAULT_MESSAGE_COPY.PasswordHint);
            });

            it('should set a value to IsEncrypted', () => {
                expect(item.IsEncrypted).toBe(DEFAULT_MESSAGE_COPY.IsEncrypted);
            });

            it('should set a value to ExpirationTime', () => {
                expect(item.ExpirationTime).toBe(DEFAULT_MESSAGE_COPY.ExpirationTime);
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

            it('should set a value to AddressID', () => {
                expect(item.AddressID).toBe(DEFAULT_MESSAGE_COPY.AddressID);
            });

            it('should set a value to NumEmbedded', () => {
                expect(item.NumEmbedded).toBe(DEFAULT_MESSAGE_COPY.NumEmbedded);
            });

            it('should set a value to DecryptedBody', () => {
                expect(item.DecryptedBody).toBe(DEFAULT_MESSAGE_COPY.DecryptedBody);
            });

            it('should set a value to Action', () => {
                expect(item.Action).toBe(CONSTANTS.REPLY_ALL);
            });

            it('should set a value to ParentID', () => {
                expect(item.ParentID).toBe(currentMsg.ID);
            });

            it('should set a value ID', () => {
                expect(item.ID).toBe(undefined);
            });


            it('should set the decrypted body', () => {
                expect(spySetDecryptedBody).toHaveBeenCalledWith(USER_SIGNATURE);
                expect(spySetDecryptedBody).toHaveBeenCalledWith(DEFAULT_MESSAGE_REPLY);
                expect(spySetDecryptedBody).toHaveBeenCalledTimes(2);
            });

            it('should return a new default object', () => {
                const keysItem = Object.keys(item).sort();
                const keysDefault = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID').sort();

                expect(keysItem.length).toBe(keysDefault.length);
                expect(keysItem).toEqual(keysDefault.sort());
                expect(_.contains(keysItem, 'Action')).toBe(true);
                expect(_.contains(keysItem, 'ParentID')).toBe(true);
            });

            it('should return an instance of Message', () => {
                expect(item.constructor).toMatch(/Message/);
            });

        });

        describe('A reply all message type ! 2||3', () => {
            let item, currentMsg;
            const match = { Status: 1, Send: 1, ID: 2, Email: 'jeanne@free.fr' };
            let DEFAULT_MESSAGE_COPY;

            const DEFAULT_MESSAGE_REPLY = '<blockquote class="protonmail_quote" type="cite">-------- Original Message --------<br>Subject: polo<br>Local Time: localReadableTime<br>UTC Time: utcReadableTime<br>From: polo@test.com<br>To: <br><br>prepareContent</blockquote><br>';

            beforeEach(() => {
                spyPrepareContent = jasmine.createSpy();
                spyLocalReadableTime = jasmine.createSpy();
                spyUtcReadableTime = jasmine.createSpy();
                spyGetDecryptedBody = jasmine.createSpy();
                spySetDecryptedBody = jasmine.createSpy();
                spyMessageModelMock = jasmine.createSpy();
                userMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2, Email: 'robert@free.fr' }, match];
                spyOn(signatureBuilder, 'insert').and.returnValue(USER_SIGNATURE);
                spyOn(tools, 'contactsToString').and.returnValue('');
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                spyOn(DOMPurify, 'sanitize').and.callFake(_.identity);

                DEFAULT_MESSAGE_COPY = _.extend({}, DEFAULT_MESSAGE, {
                    Subject: 'polo',
                    ToList: ['monique'],
                    CCList: [{
                        Address: 's@mulot.fr'
                    }],
                    BCCList: []
                });
                currentMsg = _.extend({}, message, {
                    ID: Date.now(),
                    Subject: 'polo',
                    ReplyTo: 'monique',
                    ToList: [],
                    CCList: [{
                        Address: 's@mulot.fr'
                    }],
                    BCCList: [{
                        Address: 'jean@bob.fr'
                    }],
                    Sender: {
                        Address: 'polo@test.com'
                    },
                    DecryptedBody: USER_SIGNATURE2
                });
                item = factory.create('replyall', currentMsg);
            });

            it('should build a new message', () => {
                expect(spyMessageModelMock).toHaveBeenCalledWith(undefined);
                expect(spyMessageModelMock).toHaveBeenCalledTimes(1);
            });

            it('should prepareContent', () => {
                expect(spyPrepareContent).toHaveBeenCalledTimes(1);
                const [ content, message, options ] = spyPrepareContent.calls.argsFor(0);
                expect(content).toBe(MESSAGE_BODY);
                expect(message.ParentID).toBe(DEFAULT_MESSAGE_COPY.ID);
                expect(options).toEqual({ blacklist: ['*'] });
            });

            it('should have called the filter localReadableTime ', () => {
                expect(spyLocalReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyLocalReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have called the filter utcReadableTime ', () => {
                expect(spyUtcReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyUtcReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have formated contact as a string ', () => {
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.CCList);
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.ToList);
                expect(tools.contactsToString).toHaveBeenCalledTimes(2);
            });

            it('should read the default message body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should sanitize data ', () => {
                expect(DOMPurify.sanitize).toHaveBeenCalledWith(`Subject: ${currentMsg.Subject}<br>`);
                expect(DOMPurify.sanitize).toHaveBeenCalledTimes(1);
            });

            it('should create a new signature', () => {
                expect(signatureBuilder.insert).toHaveBeenCalled();
                expect(signatureBuilder.insert).toHaveBeenCalledWith(jasmine.any(Message), { action: 'replyall' });
            });

            it('should add two new keys for this message', () => {
                const item = signatureBuilder.insert.calls.argsFor(0)[0];
                const list = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID');
                const listKeysItem = Object.keys(item);
                expect(listKeysItem.length).toBe(list.length);
                expect(_.contains(listKeysItem, 'Action')).toBe(true);
                expect(_.contains(listKeysItem, 'ParentID')).toBe(true);
            });

            it('should set a value to Type', () => {
                expect(item.Type).toBe(DEFAULT_MESSAGE_COPY.Type);
            });

            it('should set a value to ToList', () => {
                expect(item.ToList).toEqual(DEFAULT_MESSAGE_COPY.ToList);
            });

            it('should set a value to CCList', () => {
                expect(item.CCList).toEqual(DEFAULT_MESSAGE_COPY.CCList);
            });

            it('should set a value to BCCList', () => {
                expect(item.BCCList).toEqual(DEFAULT_MESSAGE_COPY.BCCList);
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
                expect(item.Subject).toBe(`Re: ${DEFAULT_MESSAGE_COPY.Subject}`);
            });

            it('should set a value to PasswordHint', () => {
                expect(item.PasswordHint).toBe(DEFAULT_MESSAGE_COPY.PasswordHint);
            });

            it('should set a value to IsEncrypted', () => {
                expect(item.IsEncrypted).toBe(DEFAULT_MESSAGE_COPY.IsEncrypted);
            });

            it('should set a value to ExpirationTime', () => {
                expect(item.ExpirationTime).toBe(DEFAULT_MESSAGE_COPY.ExpirationTime);
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

            it('should set a value to AddressID', () => {
                expect(item.AddressID).toBe(DEFAULT_MESSAGE_COPY.AddressID);
            });

            it('should set a value to NumEmbedded', () => {
                expect(item.NumEmbedded).toBe(DEFAULT_MESSAGE_COPY.NumEmbedded);
            });

            it('should set a value to DecryptedBody', () => {
                expect(item.DecryptedBody).toBe(DEFAULT_MESSAGE_COPY.DecryptedBody);
            });

            it('should set a value to Action', () => {
                expect(item.Action).toBe(CONSTANTS.REPLY_ALL);
            });

            it('should set a value to ParentID', () => {
                expect(item.ParentID).toBe(currentMsg.ID);
            });

            it('should set a value ID', () => {
                expect(item.ID).toBe(undefined);
            });


            it('should set the decrypted body', () => {
                expect(spySetDecryptedBody).toHaveBeenCalledWith(USER_SIGNATURE);
                expect(spySetDecryptedBody).toHaveBeenCalledWith(DEFAULT_MESSAGE_REPLY);
                expect(spySetDecryptedBody).toHaveBeenCalledTimes(2);
            });

            it('should return a new default object', () => {
                const keysItem = Object.keys(item).sort();
                const keysDefault = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID').sort();

                expect(keysItem.length).toBe(keysDefault.length);
                expect(keysItem).toEqual(keysDefault.sort());
                expect(_.contains(keysItem, 'Action')).toBe(true);
                expect(_.contains(keysItem, 'ParentID')).toBe(true);
            });

            it('should return an instance of Message', () => {
                expect(item.constructor).toMatch(/Message/);
            });

        });

        describe('A forward message', () => {
            let item, currentMsg;
            const match = { Status: 1, Send: 1, ID: 2 };
            let DEFAULT_MESSAGE_COPY;

            const DEFAULT_MESSAGE_REPLY = '<blockquote class="protonmail_quote" type="cite">-------- Original Message --------<br>Subject: polo<br>Local Time: localReadableTime<br>UTC Time: utcReadableTime<br>From: polo@test.com<br>To: <br><br>prepareContent</blockquote><br>';

            beforeEach(() => {
                spyPrepareContent = jasmine.createSpy();
                spyLocalReadableTime = jasmine.createSpy();
                spyUtcReadableTime = jasmine.createSpy();
                spyGetDecryptedBody = jasmine.createSpy();
                spySetDecryptedBody = jasmine.createSpy();
                spyMessageModelMock = jasmine.createSpy();
                userMock.Addresses = [TESTABLE_ADDRESS_DEFAULT, { Status: 2 }, match];
                spyOn(signatureBuilder, 'insert').and.returnValue(USER_SIGNATURE);
                spyOn(tools, 'contactsToString').and.returnValue('');
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                spyOn(DOMPurify, 'sanitize').and.callFake(_.identity);

                DEFAULT_MESSAGE_COPY = _.extend({}, DEFAULT_MESSAGE, {
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: ['bobby'],
                    BCCList: ['bobette']
                });
                currentMsg = _.extend({}, message, {
                    ID: Date.now(),
                    Type: 2,
                    Subject: 'polo',
                    ToList: ['bob'],
                    CCList: ['bobby'],
                    BCCList: ['bobette'],
                    Sender: {
                        Address: 'polo@test.com'
                    },
                    DecryptedBody: USER_SIGNATURE2
                });
                item = factory.create('forward', currentMsg);
            });

            it('should build a new message', () => {
                expect(spyMessageModelMock).toHaveBeenCalledWith(undefined);
                expect(spyMessageModelMock).toHaveBeenCalledTimes(1);
            });

            it('should prepareContent', () => {
                expect(spyPrepareContent).toHaveBeenCalledTimes(1);
                const [ content, message, options ] = spyPrepareContent.calls.argsFor(0);
                expect(content).toBe(MESSAGE_BODY);
                expect(message.ParentID).toBe(DEFAULT_MESSAGE_COPY.ID);
                expect(options).toEqual({ blacklist: ['*'] });
            });

            it('should have called the filter localReadableTime ', () => {
                expect(spyLocalReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyLocalReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have called the filter utcReadableTime ', () => {
                expect(spyUtcReadableTime).toHaveBeenCalledWith(DEFAULT_MESSAGE_COPY.Time);
                expect(spyUtcReadableTime).toHaveBeenCalledTimes(1);
            });

            it('should have formated contact as a string ', () => {
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.CCList);
                expect(tools.contactsToString).toHaveBeenCalledWith(currentMsg.ToList);
                expect(tools.contactsToString).toHaveBeenCalledTimes(2);
            });

            it('should read the default message body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should sanitize data ', () => {
                expect(DOMPurify.sanitize).toHaveBeenCalledWith(`Subject: ${currentMsg.Subject}<br>`);
                expect(DOMPurify.sanitize).toHaveBeenCalledTimes(1);
            });

            it('should create a new signature', () => {
                expect(signatureBuilder.insert).toHaveBeenCalled();
                expect(signatureBuilder.insert).toHaveBeenCalledWith(jasmine.any(Message), { action: 'forward' });
            });

            it('should add two new keys for this message', () => {
                const item = signatureBuilder.insert.calls.argsFor(0)[0];
                const list = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID');
                const listKeysItem = Object.keys(item);
                expect(listKeysItem.length).toBe(list.length);
                expect(_.contains(listKeysItem, 'Action')).toBe(true);
                expect(_.contains(listKeysItem, 'ParentID')).toBe(true);
            });

            it('should set a value to Type', () => {
                expect(item.Type).toBe(DEFAULT_MESSAGE_COPY.Type);
            });

            it('should set a value to ToList', () => {
                expect(item.ToList).toEqual([]);
            });

            it('should set a value to CCList', () => {
                expect(item.CCList).toEqual([]);
            });

            it('should set a value to BCCList', () => {
                expect(item.BCCList).toEqual([]);
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
                expect(item.Subject).toBe(`Fw: ${DEFAULT_MESSAGE_COPY.Subject}`);
            });

            it('should set a value to PasswordHint', () => {
                expect(item.PasswordHint).toBe(DEFAULT_MESSAGE_COPY.PasswordHint);
            });

            it('should set a value to IsEncrypted', () => {
                expect(item.IsEncrypted).toBe(DEFAULT_MESSAGE_COPY.IsEncrypted);
            });

            it('should set a value to ExpirationTime', () => {
                expect(item.ExpirationTime).toBe(DEFAULT_MESSAGE_COPY.ExpirationTime);
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

            it('should set a value to AddressID', () => {
                expect(item.AddressID).toBe(DEFAULT_MESSAGE_COPY.AddressID);
            });

            it('should set a value to NumEmbedded', () => {
                expect(item.NumEmbedded).toBe(DEFAULT_MESSAGE_COPY.NumEmbedded);
            });

            it('should set a value to DecryptedBody', () => {
                expect(item.DecryptedBody).toBe(DEFAULT_MESSAGE_COPY.DecryptedBody);
            });

            it('should set a value to Action', () => {
                expect(item.Action).toBe(CONSTANTS.FORWARD);
            });

            it('should set a value to ParentID', () => {
                expect(item.ParentID).toBe(currentMsg.ID);
            });

            it('should set a value ID', () => {
                expect(item.ID).toBe(undefined);
            });

            it('should set the decrypted body', () => {
                expect(spySetDecryptedBody).toHaveBeenCalledWith(USER_SIGNATURE);
                expect(spySetDecryptedBody).toHaveBeenCalledWith(DEFAULT_MESSAGE_REPLY);
                expect(spySetDecryptedBody).toHaveBeenCalledTimes(2);
            });

            it('should return a new default object', () => {
                const keysItem = Object.keys(item).sort();
                const keysDefault = Object.keys(DEFAULT_MESSAGE_COPY).concat('Action', 'ParentID').sort();

                expect(keysItem.length).toBe(keysDefault.length);
                expect(keysItem).toEqual(keysDefault.sort());
                expect(_.contains(keysItem, 'Action')).toBe(true);
                expect(_.contains(keysItem, 'ParentID')).toBe(true);
            });

            it('should return an instance of Message', () => {
                expect(item.constructor).toMatch(/Message/);
            });

        });



    });

});
