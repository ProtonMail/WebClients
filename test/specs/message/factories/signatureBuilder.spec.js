import _ from 'lodash';
import service from '../../../../src/app/message/factories/signatureBuilder';
import { CONSTANTS } from '../../../../src/app/constants';

describe('signatureBuilder factory', () => {

    const CLASS_EMPTY = 'protonmail_signature_block-empty';
    const blockSignature = 'protonmail_signature_block';
    const blockUserSignature = 'protonmail_signature_block-user';
    const blockProtonSignature = 'protonmail_signature_block-proton';
    const noSignatures = `protonmail_signature_block ${CLASS_EMPTY}`;
    const noSignatureUser = `protonmail_signature_block-user ${CLASS_EMPTY}`;
    const noSignatureProton = `protonmail_signature_block-proton ${CLASS_EMPTY}`;
    const USER_SIGNATURE = '<strong>POPOPO</strong>';
    const USER_SIGNATURE2 = '<i>Elle est où Jeanne ???</i>';
    const USER_SIGNATURE_MULTIPLE = '<i>Elle est où Jeanne ???</i><br><div>DTC</div>';
    const MESSAGE_BODY = '<p>polo</p>';
    const getMessageUpdate = (user = '', proton = '') => {
        const blockEmpty = (!user && !proton) ? CLASS_EMPTY : '';
        const userEmpty = !user ? CLASS_EMPTY : '';
        const protonEmpty = !proton ? CLASS_EMPTY : '';
        return `<p>polo</p><div><br></div><div><br></div><div class="protonmail_signature_block ${blockEmpty}">
               <div class="protonmail_signature_block-user ${userEmpty}">${user}</div>
               <div class="protonmail_signature_block-proton ${protonEmpty}">${proton}</div>
           </div>`;
    };

    function suite(type, { action } = {}) {
        describe(type, () => {

            const message = { getDecryptedBody: angular.noop, isPlainText: angular.noop };

            let factory, rootScope;
            let mailSettingsMock = { Signature: '' };
            const mailSettingsModel = { get: (k) => mailSettingsMock[k] };
            let userMock = { Signature: '' };
            const tools = { replaceLineBreaks: _.identity };
            const sanitize = { input: _.identity, message: _.identity };
            const authentication = { user: userMock };
            const AppModel = { store: _.noop };

            beforeEach(angular.mock.inject(($injector) => {
                rootScope = $injector.get('$rootScope');
                factory = service(authentication, CONSTANTS, tools, sanitize, AppModel, rootScope, mailSettingsModel);
            }));

            describe('Insert signature ~ no signatures', () => {

                describe('action: new isAfter: false', () => {

                    let string;
                    beforeEach(() => {
                        spyOn(tools, 'replaceLineBreaks').and.callThrough();
                        spyOn(sanitize, 'message').and.callThrough();
                        spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                        string = factory.insert(message, { action });
                    });

                    it('should load the decrypted body', () => {
                        expect(message.getDecryptedBody).toHaveBeenCalled();
                    });

                    it('should remove line breaks', () => {
                        expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                        expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                        expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                    });

                    it('should try to clean the signature', () => {
                        expect(sanitize.message).toHaveBeenCalledTimes(1);
                        expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                    });

                    it('should clean the signature', () => {
                        const html = sanitize.message.calls.argsFor(0)[0];
                        expect(html).toMatch(/<div><br \/><\/div>/);
                        expect(html).toContain(noSignatures);
                        expect(html).toContain(noSignatureUser);
                        expect(html).toContain(noSignatureProton);
                    });

                    it('should return a default template hidden', () => {
                        expect(string).toContain(noSignatures);
                        expect(string).toContain(noSignatureUser);
                        expect(string).toContain(noSignatureProton);
                    });

                    it('should an empty line before the signature', () => {
                        expect(string).toMatch(new RegExp(`<div><br><\/div><div class="${noSignatures}"`));
                    });

                    if (!action) {
                        it('should only add one line', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(1);
                        });
                    } else {
                        it('should only add 2 lines', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                        });
                    }

                    it('should not append the signature after the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(0, size);
                        expect(output).not.toBe(MESSAGE_BODY);
                    });

                    it('should append the signature before the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(string.length, string.length - size);
                        expect(output).toBe(MESSAGE_BODY);
                    });


                    it('should not contains the proton signature', () => {
                        const text = $(string).find(`.${blockProtonSignature}`).text();
                        const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                        expect(text).not.toBe(signature);
                    });


                    it('should not contains the user signature', () => {
                        const text = $(string).find(`.${blockUserSignature}`).text();
                        const signature = $(USER_SIGNATURE).text();
                        expect(text).not.toBe(signature);
                    });
                });

                describe('action: new isAfter: true', () => {

                    let string;
                    beforeEach(() => {
                        spyOn(tools, 'replaceLineBreaks').and.callThrough();
                        spyOn(sanitize, 'message').and.callThrough();
                        spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                        string = factory.insert(message, { isAfter: true, action });
                    });

                    it('should load the decrypted body', () => {
                        expect(message.getDecryptedBody).toHaveBeenCalled();
                    });

                    it('should remove line breaks', () => {
                        expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                        expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                        expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                    });

                    it('should try to clean the signature', () => {
                        expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));

                    });

                    it('should clean the signature', () => {
                        const html = sanitize.message.calls.argsFor(0)[0];
                        expect(html).toMatch(/<div><br \/><\/div>/);
                        expect(html).toContain(noSignatures);
                        expect(html).toContain(noSignatureUser);
                        expect(html).toContain(noSignatureProton);
                    });

                    it('should return a default template hidden', () => {
                        expect(string).toContain(noSignatures);
                        expect(string).toContain(noSignatureUser);
                        expect(string).toContain(noSignatureProton);
                    });

                    it('should an empty line before the signature', () => {
                        expect(string).toMatch(new RegExp(`<div><br><\/div><div class="${noSignatures}"`));
                    });

                    if (!action) {
                        it('should only add one line', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(1);
                        });
                    } else {
                        it('should only add 2 lines', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                        });
                    }


                    it('should append the signature after the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(0, size);
                        expect(output).toBe(MESSAGE_BODY);
                    });

                    it('should not append the signature before the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(string.length, string.length - size);
                        expect(output).not.toBe(MESSAGE_BODY);
                    });


                    it('should not contains the proton signature', () => {
                        const text = $(string).find(`.${blockProtonSignature}`).text();
                        const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                        expect(text).not.toBe(signature);
                    });

                    it('should not contains the user signature', () => {
                        const text = $(string).find(`.${blockUserSignature}`).text();
                        const signature = $(USER_SIGNATURE).text();
                        expect(text).not.toBe(signature);
                    });
                });
            });

            describe('Insert signature ~ no user signature', () => {

                describe('action: new isAfter: false', () => {

                    let string;
                    beforeEach(() => {
                        mailSettingsMock.PMSignature = true;
                        spyOn(tools, 'replaceLineBreaks').and.callThrough();
                        spyOn(sanitize, 'message').and.callThrough();
                        spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                        rootScope.$emit('AppModel', { type: 'protonSignature' });
                        rootScope.$digest();
                        string = factory.insert(message, { action });
                    });

                    it('should load the decrypted body', () => {
                        expect(message.getDecryptedBody).toHaveBeenCalled();
                    });

                    it('should remove line breaks', () => {
                        expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                        expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                        expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                    });

                    it('should try to clean the signature', () => {
                        expect(sanitize.message).toHaveBeenCalledTimes(1);
                        expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                    });

                    it('should clean the signature', () => {
                        const html = sanitize.message.calls.argsFor(0)[0];
                        expect(html).toMatch(/<div><br \/><\/div>/);
                        expect(html).not.toContain(noSignatures);
                        expect(html).toContain(noSignatureUser);
                        expect(html).not.toContain(noSignatureProton);
                    });

                    it('should hide only the user signature', () => {
                        expect(string).not.toContain(noSignatures);
                        expect(string).toContain(noSignatureUser);
                        expect(string).not.toContain(noSignatureProton);
                    });

                    it('should two empty lines before the signature', () => {
                        expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                    });

                    if (!action) {
                        it('shoul add 2 lines', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                        });
                    } else {
                        it('should only add 3 lines', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                        });
                    }

                    it('should not append the signature after the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(0, size);
                        expect(output).not.toBe(MESSAGE_BODY);
                    });

                    it('should append the signature before the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(string.length, string.length - size);
                        expect(output).toBe(MESSAGE_BODY);
                    });

                    it('should contains the proton signature', () => {
                        const text = $(string).find(`.${blockProtonSignature}`).text();
                        const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                        expect(text).toBe(textConstant);
                    });

                    it('should not contains the user signature', () => {
                        const text = $(string).find(`.${blockUserSignature}`).text();
                        const signature = $(USER_SIGNATURE).text();
                        expect(text).not.toBe(signature);
                    });
                });

                describe('action: new isAfter: true', () => {

                    let string;
                    beforeEach(() => {
                        mailSettingsMock.PMSignature = true;
                        spyOn(tools, 'replaceLineBreaks').and.callThrough();
                        spyOn(sanitize, 'message').and.callThrough();
                        spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                        rootScope.$emit('AppModel', { type: 'protonSignature' });
                        rootScope.$digest();
                        string = factory.insert(message, { isAfter: true, action });
                    });

                    it('should load the decrypted body', () => {
                        expect(message.getDecryptedBody).toHaveBeenCalled();
                    });


                    it('should remove line breaks', () => {
                        expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                        expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                        expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                    });


                    it('should try to clean the signature', () => {
                        expect(sanitize.message).toHaveBeenCalledTimes(1);
                        expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                    });

                    it('should clean the signature', () => {
                        const html = sanitize.message.calls.argsFor(0)[0];
                        expect(html).toMatch(/<div><br \/><\/div>/);
                        expect(html).not.toContain(noSignatures);
                        expect(html).toContain(noSignatureUser);
                        expect(html).not.toContain(noSignatureProton);
                    });

                    it('should hide only the user signature', () => {
                        expect(string).not.toContain(noSignatures);
                        expect(string).toContain(noSignatureUser);
                        expect(string).not.toContain(noSignatureProton);
                    });

                    it('should two empty lines before the signature', () => {
                        expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                    });

                    if (!action) {
                        it('shoul add 2 lines', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                        });
                    } else {
                        it('should only add 3 lines', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                        });
                    }


                    it('should append the signature after the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(0, size);
                        expect(output).toBe(MESSAGE_BODY);
                    });

                    it('should not append the signature before the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(string.length, string.length - size);
                        expect(output).not.toBe(MESSAGE_BODY);
                    });

                    it('should contains the proton signature', () => {
                        const text = $(string).find(`.${blockProtonSignature}`).text();
                        const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                        expect(text).toBe(textConstant);
                    });

                    it('should not contains the user signature', () => {
                        const text = $(string).find(`.${blockUserSignature}`).text();
                        const signature = $(USER_SIGNATURE).text();
                        expect(text).not.toBe(signature);
                    });
                });

                afterEach(() => {
                    delete mailSettingsMock.PMSignature;
                });
            });

            describe('Insert signature ~ no proton signature', () => {

                describe('action: new isAfter: false', () => {

                    let string;
                    beforeEach(() => {
                        message.From = {
                            Signature: USER_SIGNATURE
                        };
                        spyOn(tools, 'replaceLineBreaks').and.callThrough();
                        spyOn(sanitize, 'message').and.callThrough();
                        spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                        string = factory.insert(message, { action });
                    });

                    it('should load the decrypted body', () => {
                        expect(message.getDecryptedBody).toHaveBeenCalled();
                    });

                    it('should remove line breaks', () => {
                        expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                        expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                        expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                    });

                    it('should try to clean the signature', () => {
                        expect(sanitize.message).toHaveBeenCalledTimes(1);
                        expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                    });

                    it('should clean the signature', () => {
                        const html = sanitize.message.calls.argsFor(0)[0];
                        expect(html).toMatch(/<div><br \/><\/div>/);
                        expect(html).not.toContain(noSignatures);
                        expect(html).not.toContain(noSignatureUser);
                        expect(html).toContain(noSignatureProton);
                    });

                    it('should hide only the user signature', () => {
                        expect(string).not.toContain(noSignatures);
                        expect(string).not.toContain(noSignatureUser);
                        expect(string).toContain(noSignatureProton);
                    });

                    it('should two empty lines before the signature', () => {
                        expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                    });

                    if (!action) {
                        it('shoul add 2 lines', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                        });
                    } else {
                        it('should only add 3 lines', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                        });
                    }


                    it('should not append the signature after the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(0, size);
                        expect(output).not.toBe(MESSAGE_BODY);
                    });

                    it('should append the signature before the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(string.length, string.length - size);
                        expect(output).toBe(MESSAGE_BODY);
                    });


                    it('should not contains the proton signature', () => {
                        const text = $(string).find(`.${blockProtonSignature}`).text();
                        const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                        expect(text).not.toBe(textConstant);
                    });

                    it('should contains the user signature', () => {
                        const text = $(string).find(`.${blockUserSignature}`).text();
                        const signature = $(USER_SIGNATURE).text();
                        expect(text).toBe(signature);
                    });
                });

                describe('action: new isAfter: true', () => {

                    let string;
                    beforeEach(() => {
                        message.From = {
                            Signature: USER_SIGNATURE
                        };
                        spyOn(tools, 'replaceLineBreaks').and.callThrough();
                        spyOn(sanitize, 'message').and.callThrough();
                        spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                        string = factory.insert(message, { isAfter: true, action });
                    });

                    it('should load the decrypted body', () => {
                        expect(message.getDecryptedBody).toHaveBeenCalled();
                    });

                    it('should remove line breaks', () => {
                        expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                        expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                        expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                    });

                    it('should try to clean the signature', () => {
                        expect(sanitize.message).toHaveBeenCalledTimes(1);
                        expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                    });

                    it('should clean the signature', () => {
                        const html = sanitize.message.calls.argsFor(0)[0];
                        expect(html).toMatch(/<div><br \/><\/div>/);
                        expect(html).not.toContain(noSignatures);
                        expect(html).not.toContain(noSignatureUser);
                        expect(html).toContain(noSignatureProton);
                    });

                    it('should hide only the user signature', () => {
                        expect(string).not.toContain(noSignatures);
                        expect(string).not.toContain(noSignatureUser);
                        expect(string).toContain(noSignatureProton);
                    });

                    it('should two empty lines before the signature', () => {
                        expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                    });

                    if (!action) {
                        it('shoul add 2 lines', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                        });
                    } else {
                        it('should only add 3 lines', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                        });
                    }


                    it('should append the signature after the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(0, size);
                        expect(output).toBe(MESSAGE_BODY);
                    });

                    it('should not append the signature before the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(string.length, string.length - size);
                        expect(output).not.toBe(MESSAGE_BODY);
                    });

                    it('should not contains the proton signature', () => {
                        const text = $(string).find(`.${blockProtonSignature}`).text();
                        const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                        expect(text).not.toBe(textConstant);
                    });

                    it('should contains the user signature', () => {
                        const text = $(string).find(`.${blockUserSignature}`).text();
                        const signature = $(USER_SIGNATURE).text();
                        expect(text).toBe(signature);
                    });
                });

                afterEach(() => {
                    message.From = {};
                });
            });

            describe('Insert signature', () => {

                describe('action: new isAfter: false', () => {

                    let string;
                    beforeEach(() => {
                        message.From = {
                            Signature: USER_SIGNATURE
                        };
                        mailSettingsMock.PMSignature = true;
                        spyOn(tools, 'replaceLineBreaks').and.callThrough();
                        spyOn(sanitize, 'message').and.callThrough();
                        spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                        rootScope.$emit('AppModel', { type: 'protonSignature' });
                        rootScope.$digest();
                        string = factory.insert(message, { action });
                    });

                    it('should load the decrypted body', () => {
                        expect(message.getDecryptedBody).toHaveBeenCalled();
                    });

                    it('should remove line breaks', () => {
                        expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                        expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                        expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                    });

                    it('should try to clean the signature', () => {
                        expect(sanitize.message).toHaveBeenCalledTimes(1);
                        expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                    });

                    it('should clean the signature', () => {
                        const html = sanitize.message.calls.argsFor(0)[0];
                        expect(html).toMatch(/<div><br \/><\/div>/);
                        expect(html).not.toContain(noSignatures);
                        expect(html).not.toContain(noSignatureUser);
                        expect(html).not.toContain(noSignatureProton);
                    });

                    it('should hide only the user signature', () => {
                        expect(string).not.toContain(noSignatures);
                        expect(string).not.toContain(noSignatureUser);
                        expect(string).not.toContain(noSignatureProton);
                    });

                    it('should two empty lines before the signature', () => {
                        expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                    });

                    it('should one empty lines before the proton signature', () => {
                        expect(string).toMatch(new RegExp(`(<div><br><\/div>){1}(\r\n|\r|\n) *<div class="${blockProtonSignature} "`));
                    });

                    if (!action) {
                        it('shoul add 3 lines', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                        });
                    } else {
                        it('should only add 4 lines', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(4);
                        });
                    }


                    it('should not append the signature after the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(0, size);
                        expect(output).not.toBe(MESSAGE_BODY);
                    });

                    it('should append the signature before the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(string.length, string.length - size);
                        expect(output).toBe(MESSAGE_BODY);
                    });


                    it('should contains the proton signature', () => {
                        const text = $(string).find(`.${blockProtonSignature}`).text();
                        const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                        expect(text).toBe(textConstant);
                    });

                    it('should contains the user signature', () => {
                        const text = $(string).find(`.${blockUserSignature}`).text();
                        const signature = $(USER_SIGNATURE).text();
                        expect(text).toBe(signature);
                    });
                });

                describe('action: new isAfter: true', () => {

                    let string;
                    beforeEach(() => {
                        message.From = {
                            Signature: USER_SIGNATURE
                        };
                        mailSettingsMock.PMSignature = true;
                        spyOn(tools, 'replaceLineBreaks').and.callThrough();
                        spyOn(sanitize, 'message').and.callThrough();
                        spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                        rootScope.$emit('AppModel', { type: 'protonSignature' });
                        rootScope.$digest();
                        string = factory.insert(message, { isAfter: true, action });
                    });

                    it('should load the decrypted body', () => {
                        expect(message.getDecryptedBody).toHaveBeenCalled();
                    });

                    it('should remove line breaks', () => {
                        expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                        expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                        expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                    });

                    it('should try to clean the signature', () => {
                        expect(sanitize.message).toHaveBeenCalledTimes(1);
                        expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                    });

                    it('should clean the signature', () => {
                        const html = sanitize.message.calls.argsFor(0)[0];
                        expect(html).toMatch(/<div><br \/><\/div>/);
                        expect(html).not.toContain(noSignatures);
                        expect(html).not.toContain(noSignatureUser);
                        expect(html).not.toContain(noSignatureProton);
                    });

                    it('should hide only the user signature', () => {
                        expect(string).not.toContain(noSignatures);
                        expect(string).not.toContain(noSignatureUser);
                        expect(string).not.toContain(noSignatureProton);
                    });

                    it('should two empty lines before the signature', () => {
                        expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                    });

                    it('should one empty lines before the proton signature', () => {
                        expect(string).toMatch(new RegExp(`(<div><br><\/div>){1}(\r\n|\r|\n) *<div class="${blockProtonSignature} "`));
                    });

                    if (!action) {
                        it('shoul add 3 lines', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                        });
                    } else {
                        it('should only add 4 lines', () => {
                            expect(string.match(/<div><br><\/div>/g).length).toBe(4);
                        });
                    }


                    it('should append the signature after the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(0, size);
                        expect(output).toBe(MESSAGE_BODY);
                    });

                    it('should not append the signature before the message', () => {
                        const size = MESSAGE_BODY.length;
                        const output = string.substring(string.length, string.length - size);
                        expect(output).not.toBe(MESSAGE_BODY);
                    });

                    it('should contains the proton signature', () => {
                        const text = $(string).find(`.${blockProtonSignature}`).text();
                        const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                        expect(text).toBe(textConstant);
                    });

                    it('should contains the user signature', () => {
                        const text = $(string).find(`.${blockUserSignature}`).text();
                        const signature = $(USER_SIGNATURE).text();
                        expect(text).toBe(signature);
                    });
                });

                afterEach(() => {
                    delete mailSettingsMock.PMSignature;
                });
            });
        });
    }

    suite('New message');
    suite('Reply', { action: 'reply' });
    suite('Reply all', { action: 'replyall' });
    suite('Forward', { action: 'forward' });


    describe('Update a existing signature', () => {

        let factory, rootScope;
        const tools = { replaceLineBreaks: _.identity };
        const sanitize = { input: _.identity, message: _.identity };
        const AppModel = { store: _.noop };

        const loadEnv = (user = {}, message = { From: {} }) => {
            beforeEach(angular.mock.inject(($injector) => {
                rootScope = $injector.get('$rootScope');
                const authentication = { user: _.extend({ Signature: '' }, user) };
                const mailSettingsMock = _.extend({ Signature: '' }, user);
                const mailSettingsModel = { get: (k) => mailSettingsMock[k] };
                factory = service(authentication, CONSTANTS, tools, sanitize, AppModel, rootScope, mailSettingsModel);
                rootScope.$emit('AppModel', { type: 'protonSignature' });
                rootScope.$digest();
            }));

            return _.extend({
                isPlainText: _.noop,
                getDecryptedBody: _.noop
            }, message);
        };

        describe('No:body no:message no:signatures', () => {
            let string;
            const message = loadEnv({ PMSignature: false });

            beforeEach(() => {
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(2);
            });


            it('should remove line breaks', () => {
                expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(3);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });


            it('should clean the user signature 1st', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe('');
            });

            it('should clean the message after', () => {
                const html = sanitize.message.calls.argsFor(1)[0];
                expect(html).toBe(MESSAGE_BODY);
            });

            it('should clean the new signature', () => {
                const html = sanitize.message.calls.argsFor(2)[0];
                expect(html).toMatch(/<div><br \/><\/div>/);
                expect(html).toContain(noSignatures);
                expect(html).toContain(noSignatureUser);
                expect(html).toContain(noSignatureProton);
            });

            it('should hide signatures', () => {
                expect(string).toContain(noSignatures);
                expect(string).toContain(noSignatureUser);
                expect(string).toContain(noSignatureProton);
            });

            it('should an empty line before the signature', () => {
                expect(string).toMatch(new RegExp(`<div><br><\/div><div class="${noSignatures}"`));
            });

            it('should only add one line', () => {
                expect(string.match(/<div><br><\/div>/g).length).toBe(1);
            });

            it('should append the signature after the message', () => {
                const size = MESSAGE_BODY.length;
                const output = string.substring(0, size);
                expect(output).toBe(MESSAGE_BODY);
            });

            it('should not append the signature before the message', () => {
                const size = MESSAGE_BODY.length;
                const output = string.substring(string.length, string.length - size);
                expect(output).not.toBe(MESSAGE_BODY);
            });


            it('should not contains the proton signature', () => {
                const text = $(string).find(`.${blockProtonSignature}`).text();
                const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                expect(text).not.toBe(signature);
            });

            it('should not contains the user signature', () => {
                const text = $(string).find(`.${blockUserSignature}`).text();
                const signature = $(USER_SIGNATURE).text();
                expect(text).not.toBe(signature);
            });
        });

        describe('No:body message addressSignature', () => {
            let string;
            const MESSAGE_BODY_UPDATE = getMessageUpdate();
            const message = loadEnv({ PMSignature: false }, {
                From: { Signature: USER_SIGNATURE }
            });

            beforeEach(() => {
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_UPDATE);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });


            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(2);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the user signature 1st', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(USER_SIGNATURE);
            });

            it('should clean the message after', () => {
                const html = sanitize.message.calls.argsFor(1)[0];
                expect(html).toBe(MESSAGE_BODY_UPDATE);
            });

            it('should display the user signature', () => {
                expect(string).not.toContain(noSignatures);
                expect(string).not.toContain(noSignatureUser);
                expect(string).toContain(noSignatureProton);
            });


            it('should not contains the proton signature', () => {
                const text = $(string).find(`.${blockProtonSignature}`).text();
                const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                expect(text).not.toBe(signature);
            });

            it('should contains the user signature', () => {
                const text = $(string).find(`.${blockUserSignature}`).text();
                const signature = $(USER_SIGNATURE).text();
                expect(text).toBe(signature);
            });
        });

        describe('No:body message new addressSignature', () => {
            let string;
            const MESSAGE_BODY_UPDATE = getMessageUpdate();
            const message = loadEnv({
                PMSignature: false,
                Signature: USER_SIGNATURE
            });

            beforeEach(() => {
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_UPDATE);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });


            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(2);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the user signature 1st', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(USER_SIGNATURE);
            });

            it('should clean the message after', () => {
                const html = sanitize.message.calls.argsFor(1)[0];
                expect(html).toBe(MESSAGE_BODY_UPDATE);
            });

            it('should display the proton signature', () => {
                expect(string).not.toContain(noSignatures);
                expect(string).not.toContain(noSignatureUser);
                expect(string).toContain(noSignatureProton);
            });


            it('should not contains the proton signature', () => {
                const text = $(string).find(`.${blockProtonSignature}`).text();
                const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                expect(text).not.toBe(signature);
            });

            it('should contains the user signature', () => {
                const text = $(string).find(`.${blockUserSignature}`).text();
                const signature = $(USER_SIGNATURE).text();
                expect(text).toBe(signature);
            });
        });

        describe('No:body message new addressSignature and protonSignature', () => {
            let string;
            const MESSAGE_BODY_UPDATE = getMessageUpdate(undefined, CONSTANTS.PM_SIGNATURE);

            const message = loadEnv({
                PMSignature: true,
                Signature: USER_SIGNATURE
            });

            beforeEach(() => {
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_UPDATE);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });


            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(2);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the user signature 1st', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(USER_SIGNATURE);
            });

            it('should clean the message after', () => {
                const html = sanitize.message.calls.argsFor(1)[0];
                expect(html).toBe(MESSAGE_BODY_UPDATE);
            });

            it('should display the proton signature', () => {
                expect(string).not.toContain(noSignatures);
                expect(string).not.toContain(noSignatureUser);
                expect(string).not.toContain(noSignatureProton);
            });


            it('should contains the proton signature', () => {
                const text = $(string).find(`.${blockProtonSignature}`).text();
                const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                expect(text).toBe(signature);
            });

            it('should contains the user signature', () => {
                const text = $(string).find(`.${blockUserSignature}`).text();
                const signature = $(USER_SIGNATURE).text();
                expect(text).toBe(signature);
            });
        });

        describe('No:body message update addressSignature and protonSignature', () => {
            let string;
            const MESSAGE_BODY_UPDATE = getMessageUpdate(USER_SIGNATURE, CONSTANTS.PM_SIGNATURE);
            const message = loadEnv({
                PMSignature: true,
                Signature: USER_SIGNATURE2
            });

            beforeEach(() => {
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_UPDATE);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });


            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(2);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the user signature 1st', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(USER_SIGNATURE2);
            });

            it('should clean the message after', () => {
                const html = sanitize.message.calls.argsFor(1)[0];
                expect(html).toBe(MESSAGE_BODY_UPDATE);
            });

            it('should display the proton signature', () => {
                expect(string).not.toContain(noSignatures);
                expect(string).not.toContain(noSignatureUser);
                expect(string).not.toContain(noSignatureProton);
            });


            it('should contains the proton signature', () => {
                const text = $(string).find(`.${blockProtonSignature}`).text();
                const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                expect(text).toBe(signature);
            });

            it('should contains the user signature', () => {
                const text = $(string).find(`.${blockUserSignature}`).text();
                const signature = $(USER_SIGNATURE2).text();
                expect(text).toBe(signature);
            });
        });

        describe('body message update addressSignature and protonSignature', () => {
            let string;
            const MESSAGE_BODY_UPDATE = getMessageUpdate(USER_SIGNATURE, CONSTANTS.PM_SIGNATURE);

            const message = loadEnv({
                PMSignature: true,
                Signature: USER_SIGNATURE2
            });

            beforeEach(() => {
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue('');
                string = factory.update(message, MESSAGE_BODY_UPDATE);
            });

            it('should not get the decrypted body', () => {
                expect(message.getDecryptedBody).not.toHaveBeenCalled();
            });

            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(2);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the user signature 1st', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(USER_SIGNATURE2);
            });

            it('should clean the message after', () => {
                const html = sanitize.message.calls.argsFor(1)[0];
                expect(html).toBe(MESSAGE_BODY_UPDATE);
            });

            it('should display the proton signature', () => {
                expect(string).not.toContain(noSignatures);
                expect(string).not.toContain(noSignatureUser);
                expect(string).not.toContain(noSignatureProton);
            });


            it('should contains the proton signature', () => {
                const text = $(string).find(`.${blockProtonSignature}`).text();
                const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                expect(text).toBe(signature);
            });

            it('should contains the user signature', () => {
                const text = $(string).find(`.${blockUserSignature}`).text();
                const signature = $(USER_SIGNATURE2).text();
                expect(text).toBe(signature);
            });
        });
    });

    describe('Update a existing signature plaintext', () => {

        let factory, rootScope;
        const tools = { replaceLineBreaks: _.identity };
        const sanitize = { input: _.identity, message: _.identity };
        const AppModel = { store: _.noop };
        const getTxt = (txt) => {
            const c = document.createElement('DIV');
            c.innerHTML = txt;
            return c.textContent;
        };
        const MESSAGE_BODY_PLAIN = 'polo';
        const getMessageUpdatePlain = (user = '', proton = '', haveBody = false) => {
            let str = !haveBody ? '' : `${MESSAGE_BODY_PLAIN}\n`;

            /* whitespace around user signature */
            str += `​${user}\n`;
            str += `${proton}​`;
            return str;
        };

        const loadEnv = (user = {}, message = { From: {} }) => {
            beforeEach(angular.mock.inject(($injector) => {
                rootScope = $injector.get('$rootScope');
                const authentication = { user: _.extend({ Signature: '' }, user) };
                const mailSettingsMock = _.extend({ Signature: '' }, user);
                const mailSettingsModel = { get: (k) => mailSettingsMock[k] };
                factory = service(authentication, CONSTANTS, tools, sanitize, AppModel, rootScope, mailSettingsModel);
                rootScope.$emit('AppModel', { type: 'protonSignature' });
                rootScope.$digest();
            }));

            return _.extend({
                isPlainText: () => true,
                getDecryptedBody: _.noop
            }, message);
        };

        describe('No:body no:message no:signatures', () => {
            let string;
            const message = loadEnv({ PMSignature: false });
            beforeEach(() => {
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_PLAIN);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(1);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the signature', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe('');
            });

            it('should change nothing', () => {
                expect(string).toEqual('polo');
            });
        });

        describe('No:body message addressSignature', () => {
            let string;
            const MESSAGE_BODY_UPDATE = getMessageUpdatePlain();
            const message = loadEnv({ PMSignature: false }, {
                From: { Signature: USER_SIGNATURE }
            });

            beforeEach(() => {
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_UPDATE);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(1);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the signature', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(USER_SIGNATURE);
            });

            it('should change nothing', () => {
                expect(string).toEqual(getMessageUpdatePlain(getTxt(USER_SIGNATURE)));
            });
        });

        describe('No:body message new addressSignature', () => {
            let string;
            const MESSAGE_BODY_UPDATE = getMessageUpdatePlain(USER_SIGNATURE);
            const message = loadEnv({
                PMSignature: false,
                Signature: USER_SIGNATURE2
            });

            beforeEach(() => {
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_UPDATE);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(1);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the signature', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(USER_SIGNATURE2);
            });

            it('should change nothing', () => {
                expect(string).toEqual(getMessageUpdatePlain(getTxt(USER_SIGNATURE2)));
            });
        });

        describe('No:body message new addressSignature and protonSignature', () => {
            let string;
            const MESSAGE_BODY_UPDATE = getMessageUpdatePlain(undefined, CONSTANTS.PM_SIGNATURE);

            const message = loadEnv({
                PMSignature: true,
                Signature: USER_SIGNATURE
            });

            beforeEach(() => {
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_UPDATE);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(1);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the signature', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(USER_SIGNATURE);
            });

            it('should change nothing', () => {
                const output = getMessageUpdatePlain(getTxt(USER_SIGNATURE), getTxt(CONSTANTS.PM_SIGNATURE));
                expect(string).toEqual(output);
            });
        });

        describe('No:body message update addressSignature and protonSignature', () => {
            let string;
            const MESSAGE_BODY_UPDATE = getMessageUpdatePlain(USER_SIGNATURE, CONSTANTS.PM_SIGNATURE);
            const message = loadEnv({
                PMSignature: true,
                Signature: USER_SIGNATURE2
            });

            beforeEach(() => {
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_UPDATE);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(1);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the signature', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(USER_SIGNATURE2);
            });

            it('should change nothing', () => {
                const output = getMessageUpdatePlain(getTxt(USER_SIGNATURE2), getTxt(CONSTANTS.PM_SIGNATURE));
                expect(string).toEqual(output);
            });
        });

        describe('body message update addressSignature and protonSignature', () => {
            let string;
            const MESSAGE_BODY_UPDATE = getMessageUpdatePlain(USER_SIGNATURE, CONSTANTS.PM_SIGNATURE, true);
            const message = loadEnv({
                PMSignature: true,
                Signature: USER_SIGNATURE2
            });

            beforeEach(() => {
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_UPDATE);
                string = factory.update(message, MESSAGE_BODY_UPDATE);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(1);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the signature', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(USER_SIGNATURE2);
            });

            it('should change nothing', () => {
                const output = getMessageUpdatePlain(getTxt(USER_SIGNATURE2), getTxt(CONSTANTS.PM_SIGNATURE), true);
                expect(string).toEqual(output);
            });
        });

        describe('body message update addressSignature and protonSignature multiple roww', () => {
            let string;
            const MESSAGE_BODY_UPDATE = getMessageUpdatePlain(USER_SIGNATURE, CONSTANTS.PM_SIGNATURE, true);
            const message = loadEnv({
                PMSignature: true,
                Signature: USER_SIGNATURE_MULTIPLE
            });

            beforeEach(() => {
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_UPDATE);
                string = factory.update(message, MESSAGE_BODY_UPDATE);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });

            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(1);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the signature', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(USER_SIGNATURE_MULTIPLE);
            });

            it('should change nothing', () => {
                const output = getMessageUpdatePlain(getTxt(USER_SIGNATURE_MULTIPLE), getTxt(CONSTANTS.PM_SIGNATURE), true);
                expect(string).toEqual(output);
            });
        });
    });


});
