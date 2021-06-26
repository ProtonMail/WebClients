import { PM_SIGNATURE } from 'proton-shared/lib/constants';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { message } from 'proton-shared/lib/sanitize';

import {
    insertSignature,
    CLASSNAME_SIGNATURE_CONTAINER,
    CLASSNAME_SIGNATURE_USER,
    CLASSNAME_SIGNATURE_EMPTY,
} from './messageSignature';
import { MESSAGE_ACTIONS } from '../../constants';

const content = '<p>test</p>';
const signature = `
<strong>>signature</strong>`;
const mailSettings = { PMSignature: 0 } as MailSettings;

describe('signature', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('insertSignature', () => {
        describe('rules', () => {
            it('should remove line breaks', () => {
                const result = insertSignature(content, signature, MESSAGE_ACTIONS.NEW, mailSettings, false);
                expect(result).toContain('<br><strong>');
            });

            it('should try to clean the signature', () => {
                const result = insertSignature(content, signature, MESSAGE_ACTIONS.NEW, mailSettings, false);
                expect(result).toContain('&gt;');
            });

            it('should add empty line before the signature', () => {
                const result = insertSignature(content, '', MESSAGE_ACTIONS.NEW, mailSettings, false);
                expect(result).toMatch(new RegExp(`<div><br></div>\\s*<div class="${CLASSNAME_SIGNATURE_CONTAINER}`));
            });

            it('should add different number of empty lines depending on the action', () => {
                let result = insertSignature(content, '', MESSAGE_ACTIONS.NEW, mailSettings, false);
                expect((result.match(/<div><br><\/div>/g) || []).length).toBe(1);
                result = insertSignature(content, '', MESSAGE_ACTIONS.REPLY, mailSettings, false);
                expect((result.match(/<div><br><\/div>/g) || []).length).toBe(2);
                result = insertSignature(
                    content,
                    '',
                    MESSAGE_ACTIONS.REPLY,
                    { ...mailSettings, PMSignature: 1 },
                    false
                );
                expect((result.match(/<div><br><\/div>/g) || []).length).toBe(3);
                result = insertSignature(content, signature, MESSAGE_ACTIONS.REPLY, mailSettings, false);
                expect((result.match(/<div><br><\/div>/g) || []).length).toBe(3);
                result = insertSignature(
                    content,
                    signature,
                    MESSAGE_ACTIONS.REPLY,
                    { ...mailSettings, PMSignature: 1 },
                    false
                );
                expect((result.match(/<div><br><\/div>/g) || []).length).toBe(4);
            });

            it('should append PM signature depending mailsettings', () => {
                let result = insertSignature(content, '', MESSAGE_ACTIONS.NEW, mailSettings, false);
                expect(result).not.toContain(PM_SIGNATURE);
                result = insertSignature(content, '', MESSAGE_ACTIONS.NEW, { ...mailSettings, PMSignature: 1 }, false);
                const sanitizedPmSignature = message(PM_SIGNATURE);
                expect(result).toContain(sanitizedPmSignature);
                let messagePosition = result.indexOf(content);
                let signaturePosition = result.indexOf(sanitizedPmSignature);
                expect(messagePosition).toBeGreaterThan(signaturePosition);
                result = insertSignature(content, '', MESSAGE_ACTIONS.NEW, { ...mailSettings, PMSignature: 1 }, true);
                messagePosition = result.indexOf(content);
                signaturePosition = result.indexOf(sanitizedPmSignature);
                expect(messagePosition).toBeLessThan(signaturePosition);
            });

            it('should append user signature if exists', () => {
                let result = insertSignature(content, '', MESSAGE_ACTIONS.NEW, mailSettings, false);
                expect(result).toContain(`${CLASSNAME_SIGNATURE_USER} ${CLASSNAME_SIGNATURE_EMPTY}`);
                result = insertSignature(content, signature, MESSAGE_ACTIONS.NEW, mailSettings, false);
                expect(result).toContain('signature');
                let messagePosition = result.indexOf(content);
                let signaturePosition = result.indexOf(signature);
                expect(messagePosition).toBeGreaterThan(signaturePosition);
                result = insertSignature(content, signature, MESSAGE_ACTIONS.NEW, mailSettings, true);
                messagePosition = result.indexOf(content);
                signaturePosition = result.indexOf('signature');
                expect(messagePosition).toBeLessThan(signaturePosition);
            });
        });

        describe('snapshots', () => {
            const protonSignatures = [false, true];
            const userSignatures = [false, true];
            const actions = [
                MESSAGE_ACTIONS.NEW,
                MESSAGE_ACTIONS.REPLY,
                MESSAGE_ACTIONS.REPLY_ALL,
                MESSAGE_ACTIONS.FORWARD,
            ];
            const isAfters = [false, true];

            protonSignatures.forEach((protonSignature) => {
                userSignatures.forEach((userSignature) => {
                    actions.forEach((action) => {
                        isAfters.forEach((isAfter) => {
                            const label = `should match with protonSignature ${protonSignature}, userSignature ${userSignature}, action ${action}, isAfter ${isAfter}`;
                            it(label, () => {
                                const result = insertSignature(
                                    content,
                                    userSignature ? signature : '',
                                    action,
                                    { PMSignature: protonSignature ? 1 : 0 } as MailSettings,
                                    isAfter
                                );
                                expect(result).toMatchSnapshot();
                            });
                        });
                    });
                });
            });
        });
    });
});
