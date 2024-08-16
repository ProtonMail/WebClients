import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { PM_SIGNATURE as PM_SIGNATURE_ENUM } from '@proton/shared/lib/mail/mailSettings';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';
import { message } from '@proton/shared/lib/sanitize';

import { MESSAGE_ACTIONS } from '../../constants';
import {
    CLASSNAME_SIGNATURE_CONTAINER,
    CLASSNAME_SIGNATURE_EMPTY,
    CLASSNAME_SIGNATURE_USER,
    insertSignature,
} from './messageSignature';

const content = '<p>test</p>';
const signature = `
<strong>>signature</strong>`;
const mailSettings = { PMSignature: PM_SIGNATURE_ENUM.DISABLED } as MailSettings;
const userSettings = {} as UserSettings;

const PM_SIGNATURE = getProtonMailSignature();

describe('signature', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('insertSignature', () => {
        describe('rules', () => {
            it('should not convert line breaks to <br> if HTML content', () => {
                const result = insertSignature(
                    content,
                    signature,
                    MESSAGE_ACTIONS.NEW,
                    mailSettings,
                    userSettings,
                    undefined,
                    false
                );
                expect(result).toContain('<strong>');
            });

            it('should not convert line breaks to <br> if plain text content', () => {
                const result = insertSignature(
                    content,
                    'hello \n world',
                    MESSAGE_ACTIONS.NEW,
                    mailSettings,
                    userSettings,
                    undefined,
                    false
                );
                expect(result).toContain('hello <br> world');
            });

            it('should try to clean the signature', () => {
                const result = insertSignature(
                    content,
                    signature,
                    MESSAGE_ACTIONS.NEW,
                    mailSettings,
                    userSettings,
                    undefined,
                    false
                );
                expect(result).toContain('&gt;');
            });

            it('should add empty line before the signature', () => {
                const result = insertSignature(
                    content,
                    '',
                    MESSAGE_ACTIONS.NEW,
                    mailSettings,
                    userSettings,
                    undefined,
                    false
                );
                expect(result).toMatch(new RegExp(`<div><br></div>\\s*<div class="${CLASSNAME_SIGNATURE_CONTAINER}`));
            });

            it('should add different number of empty lines depending on the action', () => {
                let result = insertSignature(
                    content,
                    '',
                    MESSAGE_ACTIONS.NEW,
                    mailSettings,
                    userSettings,
                    undefined,
                    false
                );
                expect((result.match(/<div><br><\/div>/g) || []).length).toBe(1);
                result = insertSignature(
                    content,
                    '',
                    MESSAGE_ACTIONS.REPLY,
                    mailSettings,
                    userSettings,
                    undefined,
                    false
                );
                expect((result.match(/<div><br><\/div>/g) || []).length).toBe(2);
                result = insertSignature(
                    content,
                    '',
                    MESSAGE_ACTIONS.REPLY,
                    { ...mailSettings, PMSignature: PM_SIGNATURE_ENUM.ENABLED },
                    userSettings,
                    undefined,
                    false
                );
                expect((result.match(/<div><br><\/div>/g) || []).length).toBe(3);
                result = insertSignature(
                    content,
                    signature,
                    MESSAGE_ACTIONS.REPLY,
                    mailSettings,
                    userSettings,
                    undefined,
                    false
                );
                expect((result.match(/<div><br><\/div>/g) || []).length).toBe(3);
                result = insertSignature(
                    content,
                    signature,
                    MESSAGE_ACTIONS.REPLY,
                    { ...mailSettings, PMSignature: PM_SIGNATURE_ENUM.ENABLED },
                    userSettings,
                    undefined,
                    false
                );
                expect((result.match(/<div><br><\/div>/g) || []).length).toBe(4);
            });

            it('should append PM signature depending mailsettings', () => {
                let result = insertSignature(content, '', MESSAGE_ACTIONS.NEW, mailSettings, {}, undefined, false);
                expect(result).not.toContain(PM_SIGNATURE);
                result = insertSignature(
                    content,
                    '',
                    MESSAGE_ACTIONS.NEW,
                    { ...mailSettings, PMSignature: PM_SIGNATURE_ENUM.ENABLED },
                    userSettings,
                    undefined,
                    false
                );
                const sanitizedPmSignature = message(PM_SIGNATURE);
                expect(result).toContain(sanitizedPmSignature);
                let messagePosition = result.indexOf(content);
                let signaturePosition = result.indexOf(sanitizedPmSignature);
                expect(messagePosition).toBeGreaterThan(signaturePosition);
                result = insertSignature(
                    content,
                    '',
                    MESSAGE_ACTIONS.NEW,
                    { ...mailSettings, PMSignature: PM_SIGNATURE_ENUM.ENABLED },
                    userSettings,
                    undefined,
                    true
                );
                messagePosition = result.indexOf(content);
                signaturePosition = result.indexOf(sanitizedPmSignature);
                expect(messagePosition).toBeLessThan(signaturePosition);
            });

            it('should append user signature if exists', () => {
                let result = insertSignature(
                    content,
                    '',
                    MESSAGE_ACTIONS.NEW,
                    mailSettings,
                    userSettings,
                    undefined,
                    false
                );
                expect(result).toContain(`${CLASSNAME_SIGNATURE_USER} ${CLASSNAME_SIGNATURE_EMPTY}`);
                result = insertSignature(
                    content,
                    signature,
                    MESSAGE_ACTIONS.NEW,
                    mailSettings,
                    userSettings,
                    undefined,
                    false
                );
                expect(result).toContain('signature');
                let messagePosition = result.indexOf(content);
                let signaturePosition = result.indexOf(signature);
                expect(messagePosition).toBeGreaterThan(signaturePosition);
                result = insertSignature(
                    content,
                    signature,
                    MESSAGE_ACTIONS.NEW,
                    mailSettings,
                    userSettings,
                    undefined,
                    true
                );
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
                                    {
                                        PMSignature: protonSignature
                                            ? PM_SIGNATURE_ENUM.ENABLED
                                            : PM_SIGNATURE_ENUM.DISABLED,
                                    } as MailSettings,
                                    userSettings,
                                    undefined,
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
