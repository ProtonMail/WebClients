import { sanitizeMessage } from '@proton/sanitize/purify';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import { PM_SIGNATURE as PM_SIGNATURE_ENUM } from '@proton/shared/lib/mail/mailSettings';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';

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
        describe('proton signature rules', () => {
            const pmSignatureEmptyClasses = 'protonmail_signature_block-proton protonmail_signature_block-empty';

            describe('paid users', () => {
                it('should not add signature if disabled', () => {
                    const result = insertSignature(
                        content,
                        signature,
                        { PMSignature: PM_SIGNATURE_ENUM.DISABLED } as MailSettings,
                        userSettings,
                        undefined
                    );

                    expect(result).toContain(pmSignatureEmptyClasses);
                });

                it('should not add signature if enabled and locked', () => {
                    const result = insertSignature(
                        content,
                        signature,
                        { PMSignature: PM_SIGNATURE_ENUM.LOCKED } as MailSettings,
                        userSettings,
                        undefined
                    );
                    expect(result).toContain(pmSignatureEmptyClasses);
                });

                it('should add signature if enabled', () => {
                    const result = insertSignature(
                        content,
                        signature,
                        { PMSignature: PM_SIGNATURE_ENUM.ENABLED } as MailSettings,
                        userSettings,
                        undefined
                    );

                    expect(result).not.toContain(pmSignatureEmptyClasses);
                });
            });
        });

        describe('rules', () => {
            it('should not convert line breaks to <br> if HTML content', () => {
                const result = insertSignature(content, signature, mailSettings, userSettings, undefined);
                expect(result).toContain('<strong>');
            });

            it('should not convert line breaks to <br> if plain text content', () => {
                const result = insertSignature(content, 'hello \n world', mailSettings, userSettings, undefined);
                expect(result).toContain('hello <br> world');
            });

            it('should try to clean the signature', () => {
                const result = insertSignature(content, signature, mailSettings, userSettings, undefined);
                expect(result).toContain('&gt;');
            });

            it('should add empty line before the signature', () => {
                const result = insertSignature(content, '', mailSettings, userSettings, undefined);
                expect(result).toMatch(new RegExp(`<div><br></div>\\s*<div class="${CLASSNAME_SIGNATURE_CONTAINER}`));
            });

            it('should add different number of empty lines depending on the signatures', () => {
                const pmSignatureEnabled = { ...mailSettings, PMSignature: PM_SIGNATURE_ENUM.ENABLED };
                const countEmptyLines = (result: string) => (result.match(/<div><br><\/div>/g) || []).length;

                expect(countEmptyLines(insertSignature(content, '', mailSettings, userSettings, undefined))).toBe(1);
                expect(countEmptyLines(insertSignature(content, '', pmSignatureEnabled, userSettings, undefined))).toBe(
                    2
                );
                expect(
                    countEmptyLines(insertSignature(content, signature, mailSettings, userSettings, undefined))
                ).toBe(2);
                expect(
                    countEmptyLines(insertSignature(content, signature, pmSignatureEnabled, userSettings, undefined))
                ).toBe(3);
            });

            it('should append PM signature depending mailsettings', () => {
                let result = insertSignature(content, '', mailSettings, {}, undefined);
                expect(result).not.toContain(PM_SIGNATURE);
                result = insertSignature(
                    content,
                    '',
                    { ...mailSettings, PMSignature: PM_SIGNATURE_ENUM.ENABLED },
                    userSettings,
                    undefined
                );
                const sanitizedPmSignature = sanitizeMessage(PM_SIGNATURE);
                expect(result).toContain(sanitizedPmSignature);
                const messagePosition = result.indexOf(content);
                const signaturePosition = result.indexOf(sanitizedPmSignature);
                expect(messagePosition).toBeGreaterThan(signaturePosition);
            });

            it('should append user signature if exists', () => {
                let result = insertSignature(content, '', mailSettings, userSettings, undefined);
                expect(result).toContain(`${CLASSNAME_SIGNATURE_USER} ${CLASSNAME_SIGNATURE_EMPTY}`);
                result = insertSignature(content, signature, mailSettings, userSettings, undefined);
                expect(result).toContain('signature');
                const messagePosition = result.indexOf(content);
                const signaturePosition = result.indexOf(signature);
                expect(messagePosition).toBeGreaterThan(signaturePosition);
            });
        });

        describe('snapshots', () => {
            const protonSignatures = [false, true];
            const userSignatures = [false, true];

            protonSignatures.forEach((protonSignature) => {
                userSignatures.forEach((userSignature) => {
                    const label = `should match with protonSignature ${protonSignature}, userSignature ${userSignature}`;
                    it(label, () => {
                        const result = insertSignature(
                            content,
                            userSignature ? signature : '',
                            {
                                PMSignature: protonSignature ? PM_SIGNATURE_ENUM.ENABLED : PM_SIGNATURE_ENUM.DISABLED,
                            } as MailSettings,
                            userSettings,
                            undefined
                        );
                        expect(result).toMatchSnapshot();
                    });
                });
            });
        });
    });
});
