import { OpenPGPKey } from 'pmcrypto';
import { SIGNATURE_START, VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import {
    ENCRYPTION_PREFERENCES_ERROR_TYPES,
    EncryptionPreferencesError,
} from 'proton-shared/lib/mail/encryptionPreferences';
import { MIME_TYPES, PACKAGE_TYPE } from 'proton-shared/lib/constants';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { StatusIcon, STATUS_ICONS_FILLS } from '../../models/crypto';
import { MessageExtended, MessageVerification } from '../../models/message';
import { getReceivedStatusIcon, getSendStatusIcon, getSentStatusIconInfo, getStatusIconName } from './icon';

const { NOT_SIGNED, NOT_VERIFIED, SIGNED_AND_VALID, SIGNED_AND_INVALID } = VERIFICATION_STATUS;

const fakeKey1: OpenPGPKey = {
    getFingerprint() {
        return 'fakeKey1';
    },
    users: [
        {
            userId: {
                userid: '<user@pm.me>',
            },
        },
    ],
} as any;

describe('icon', () => {
    describe('getSendStatusIcon', () => {
        it('should return a blue plain lock when sending to internal users without pinned keys', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PM,
                mimeType: MIME_TYPES.DEFAULT,
                hasApiKeys: true,
                hasPinnedKeys: false,
                isPublicKeyPinned: false,
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-info',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.PLAIN,
                text: 'End-to-end encrypted',
            });
        });

        it('should return a blue lock with checkmark when sending to internal users with a pinned key', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PM,
                mimeType: MIME_TYPES.DEFAULT,
                hasApiKeys: true,
                hasPinnedKeys: true,
                isPublicKeyPinned: true,
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-info',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.CHECKMARK,
                text: 'End-to-end encrypted to verified recipient',
            });
        });

        it('should return an error sign when sending to internal users with pinned keys, but the pinned key is not used', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PM,
                mimeType: MIME_TYPES.DEFAULT,
                hasApiKeys: true,
                hasPinnedKeys: true,
                isPublicKeyPinned: false,
                error: new EncryptionPreferencesError(
                    ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_NOT_PINNED,
                    'test error'
                ),
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-danger',
                isEncrypted: false,
                fill: STATUS_ICONS_FILLS.FAIL,
                text: 'test error',
            });
        });

        it('should return a green plain lock when sending to WKD users without pinned keys', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_INLINE,
                mimeType: MIME_TYPES.PLAINTEXT,
                hasApiKeys: true,
                hasPinnedKeys: false,
                isPublicKeyPinned: false,
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.PLAIN,
                text: 'End-to-end encrypted',
            });
        });

        it('should return a green lock with checkmark when sending to WKD users with a pinned key', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                mimeType: MIME_TYPES.MIME,
                hasApiKeys: true,
                hasPinnedKeys: true,
                isPublicKeyPinned: true,
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.CHECKMARK,
                text: 'End-to-end encrypted to verified recipient',
            });
        });

        it('should return ar error sign when sending to WKD users with pinned keys, but the pinned key is not used', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                mimeType: MIME_TYPES.MIME,
                hasApiKeys: true,
                hasPinnedKeys: true,
                isPublicKeyPinned: false,
                error: new EncryptionPreferencesError(
                    ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_NOT_PINNED,
                    'test error'
                ),
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-danger',
                isEncrypted: false,
                fill: STATUS_ICONS_FILLS.FAIL,
                text: 'test error',
            });
        });

        it('should return a green lock with warning sign when sending to WKD users without pinned keys with warnings', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                mimeType: MIME_TYPES.MIME,
                hasApiKeys: true,
                hasPinnedKeys: false,
                isPublicKeyPinned: false,
                warnings: ['warning test 1', 'warning test 2'],
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.WARNING,
                text: "End-to-end encrypted. Recipient's key validation failed: warning test 1; warning test 2",
            });
        });

        it('should return a green lock with warning sign when sending to WKD users with pinned keys with warnings', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                mimeType: MIME_TYPES.MIME,
                hasApiKeys: true,
                hasPinnedKeys: true,
                isPublicKeyPinned: true,
                warnings: ['warning test 1', 'warning test 2'],
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.WARNING,
                text: "End-to-end encrypted. Recipient's key validation failed: warning test 1; warning test 2",
            });
        });

        it('should return a green open lock for external PGP messages only signed', () => {
            const sendPreferences = {
                encrypt: false,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                mimeType: MIME_TYPES.MIME,
                hasApiKeys: false,
                hasPinnedKeys: false,
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-success',
                isEncrypted: false,
                fill: STATUS_ICONS_FILLS.SIGN,
                text: 'PGP-signed',
            });
        });

        it('should return a green lock with pencil sign for external PGP-encrypted (and signed) messages', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_INLINE,
                mimeType: MIME_TYPES.PLAINTEXT,
                hasApiKeys: false,
                hasPinnedKeys: true,
                isPublicKeyPinned: false,
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.SIGN,
                text: 'PGP-encrypted',
            });
        });

        it('should return a green lock with checkmark for external PGP messages if encrypted with a pinned key', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                mimeType: MIME_TYPES.MIME,
                hasApiKeys: false,
                hasPinnedKeys: true,
                isPublicKeyPinned: true,
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.CHECKMARK,
                text: 'PGP-encrypted to verified recipient',
            });
        });

        it('should return a green lock with warning sign for external PGP messages with warnings on the pinned key', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                mimeType: MIME_TYPES.MIME,
                hasApiKeys: false,
                hasPinnedKeys: true,
                isPublicKeyPinned: true,
                warnings: ['warning test 1', 'warning test 2'],
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.WARNING,
                text: "PGP-encrypted. Recipient's key validation failed: warning test 1; warning test 2",
            });
        });

        it('should return nothing when sending unencrypted and unsigned', () => {
            const sendPreferences = {
                encrypt: false,
                sign: false,
                pgpScheme: PACKAGE_TYPE.SEND_CLEAR,
                mimeType: MIME_TYPES.MIME,
                hasApiKeys: false,
                hasPinnedKeys: false,
                isPublicKeyPinned: false,
            };
            expect(getSendStatusIcon(sendPreferences)).toBeUndefined();
        });
    });

    describe('getSentStatusIcon for individual recipients', () => {
        const email = 'test@pm.me';
        const getIconFromHeaders = (headers: { [key: string]: string }, emailAddress: string) => {
            const message = ({
                data: {
                    ParsedHeaders: headers,
                },
            } as unknown) as MessageExtended;
            const { mapStatusIcon } = getSentStatusIconInfo(message) || {};
            return mapStatusIcon[emailAddress];
        };

        it('should return no lock for messages sent by you neither encrypted nor authenticated', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=none',
                'X-Pm-Recipient-Encryption': 'test%40pm.me=none',
                'X-Pm-Content-Encryption': 'end-to-end',
            };
            const icon = getIconFromHeaders(headers, email);
            expect(icon).toEqual(undefined);
        });

        it('should return a green plain lock for messages sent by ProtonMail encrypted but not authenticated to PGP recipient', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=none',
                'X-Pm-Recipient-Encryption': 'test%40pm.me=pgp-inline',
                'X-Pm-Content-Encryption': 'on-delivery',
            };
            const icon = getIconFromHeaders(headers, email);
            expect(icon).toMatchObject({
                colorClassName: 'color-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.PLAIN,
                text: 'Encrypted by ProtonMail to PGP recipient',
            });
        });

        it('should return a green lock with pencil for messages sent by you authenticated but not encrypted to PGP recipient', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=pgp-inline',
                'X-Pm-Recipient-Encryption': 'test%40pm.me=none',
                'X-Pm-Content-Encryption': 'on-compose',
            };
            const icon = getIconFromHeaders(headers, email);
            expect(icon).toMatchObject({
                colorClassName: 'color-success',
                isEncrypted: false,
                fill: STATUS_ICONS_FILLS.SIGN,
                text: 'PGP-signed',
            });
        });

        it('should return a blue lock with check-mark for messages sent by you encrypted to a ProtonMail recipient with pinned keys', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=pgp-pm',
                'X-Pm-Recipient-Encryption': 'test%40pm.me=pgp-pm-pinned',
                'X-Pm-Content-Encryption': 'end-to-end',
            };
            const icon = getIconFromHeaders(headers, email);
            expect(icon).toMatchObject({
                colorClassName: 'color-info',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.CHECKMARK,
                text: 'End-to-end encrypted to verified recipient',
            });
        });

        it('should return a green plain lock for messages sent by you encrypted and authenticated to PGP recipient with pinned keys', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=pgp-mime',
                'X-Pm-Recipient-Encryption': 'test%40pm.me=pgp-mime-pinned',
                'X-Pm-Content-Encryption': 'end-to-end',
            };
            const icon = getIconFromHeaders(headers, email);
            expect(icon).toMatchObject({
                colorClassName: 'color-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.CHECKMARK,
                text: 'End-to-end encrypted to verified PGP recipient',
            });
        });

        it('should return a blue plain lock for messages sent by you encrypted and authenticated to ProtonMail recipient', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=pgp-pm',
                'X-Pm-Recipient-Encryption': 'test%40pm.me=pgp-pm',
                'X-Pm-Content-Encryption': 'end-to-end',
            };
            const icon = getIconFromHeaders(headers, email);
            expect(icon).toMatchObject({
                colorClassName: 'color-info',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.PLAIN,
                text: 'End-to-end encrypted',
            });
        });

        it('should return a blue plain lock for messages sent by Protonmail encrypted and authenticated to ProtonMail recipient', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=pgp-pm',
                'X-Pm-Recipient-Encryption': 'test%40pm.me=pgp-pm',
                'X-Pm-Content-Encryption': 'on-delivery',
            };
            const icon = getIconFromHeaders(headers, email);
            expect(icon).toMatchObject({
                colorClassName: 'color-info',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.PLAIN,
                text: 'Encrypted by ProtonMail',
            });
        });

        it('should return a blue lock with check mark for messages sent by ProtonMail encrypted and authenticated to ProtonMail recipient with pinned keys', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=pgp-pm',
                'X-Pm-Recipient-Encryption': 'test%40pm.me=pgp-pm-pinned',
                'X-Pm-Content-Encryption': 'on-delivery',
            };
            const icon = getIconFromHeaders(headers, email);
            expect(icon).toMatchObject({
                colorClassName: 'color-info',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.CHECKMARK,
                text: 'Encrypted by ProtonMail to verified recipient',
            });
        });

        it('should return a green plain lock for messages sent by ProtonMail encrypted and authenticated to PGP recipient with pinned keys', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=pgp-mime',
                'X-Pm-Recipient-Encryption': 'test%40pm.me=pgp-mime-pinned',
                'X-Pm-Content-Encryption': 'on-delivery',
            };
            const icon = getIconFromHeaders(headers, email);
            expect(icon).toMatchObject({
                colorClassName: 'color-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.CHECKMARK,
                text: 'Encrypted by ProtonMail to verified PGP recipient',
            });
        });

        it('should return a blue plain lock for messages sent by you encrypted-to-outside', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=pgp-eo',
                'X-Pm-Recipient-Encryption': 'test%40pm.me=pgp-eo',
                'X-Pm-Content-Encryption': 'end-to-end',
            };
            const icon = getIconFromHeaders(headers, email);
            expect(icon).toMatchObject({
                colorClassName: 'color-info',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.PLAIN,
                text: 'End-to-end encrypted',
            });
        });

        it('should return undefined when the headers are missing', () => {
            const headers = {};
            const icon = getIconFromHeaders(headers, email);
            expect(icon).toEqual(undefined);
        });

        it('should return undefined when the headers do not contain the email address', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=pgp-pm',
                'X-Pm-Recipient-Encryption': 'testing%40pm.me=pgp-pm',
                'X-Pm-Content-Encryption': 'end-to-end',
            };
            const icon = getIconFromHeaders(headers, email);
            expect(icon).toEqual(undefined);
        });
    });

    describe('getSentStatusIcon for aggregated icon', () => {
        const getIconFromHeaders = (headers: { [key: string]: string }) => {
            const message = ({
                data: {
                    ParsedHeaders: headers,
                },
            } as unknown) as MessageExtended;
            const { globalIcon } = getSentStatusIconInfo(message);
            return globalIcon;
        };

        it('should return a blue lock with checkmark when sending to all pinned with some internal', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=pgp-mime;test2%40pm.me=pgp-inline;test3%40pm.me=pgp-pm',
                'X-Pm-Recipient-Encryption':
                    'test%40pm.me=pgp-mime-pinned;test2%40pm.me=pgp-inline-pinned;test3%40pm.me=pgp-pm-pinned',
                'X-Pm-Content-Encryption': 'end-to-end',
            };
            const icon = getIconFromHeaders(headers);
            expect(icon).toMatchObject({
                colorClassName: 'color-info',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.CHECKMARK,
                text: 'Sent by you with end-to-end encryption to verified recipients',
            });
        });

        it('should return a green lock with checkmark when sending to all pinned external', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=pgp-mime;test2%40pm.me=pgp-inline',
                'X-Pm-Recipient-Encryption': 'test%40pm.me=pgp-mime-pinned;test2%40pm.me=pgp-inline-pinned;',
                'X-Pm-Content-Encryption': 'on-delivery',
            };
            const icon = getIconFromHeaders(headers);
            expect(icon).toMatchObject({
                colorClassName: 'color-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.CHECKMARK,
                text: 'Sent by ProtonMail with zero-access encryption to verified recipients',
            });
        });

        it('should return a blue plain lock with checkmark when sending EO', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=pgp-eo',
                'X-Pm-Recipient-Encryption': 'test%40pm.me=pgp-eo;',
                'X-Pm-Content-Encryption': 'end-to-end',
            };
            const icon = getIconFromHeaders(headers);
            expect(icon).toMatchObject({
                colorClassName: 'color-info',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.PLAIN,
                text: 'Sent by you with end-to-end encryption',
            });
        });

        it('should return a green plain lock when sending to some not pinned external', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=pgp-mime;test2%40pm.me=pgp-inline',
                'X-Pm-Recipient-Encryption': 'test%40pm.me=pgp-mime-pinned;test2%40pm.me=pgp-inline;',
                'X-Pm-Content-Encryption': 'on-delivery',
            };
            const icon = getIconFromHeaders(headers);
            expect(icon).toMatchObject({
                colorClassName: 'color-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.PLAIN,
                text: 'Sent by ProtonMail with zero-access encryption',
            });
        });

        it('should return a blue plain lock when sending encrypted to mixed recipients', () => {
            const headers = {
                'X-Pm-Recipient-Authentication': 'test%40pm.me=pgp-pm;test2%40pm.me=pgp-inline;test3%40pm.me=pgp-eo',
                'X-Pm-Recipient-Encryption': 'test%40pm.me=pgp-pm-pinned;test2%40pm.me=pgp-inline;test3%40pm.me=pgp-eo',
                'X-Pm-Content-Encryption': 'end-to-end',
            };
            const icon = getIconFromHeaders(headers);
            expect(icon).toMatchObject({
                colorClassName: 'color-info',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.PLAIN,
                text: 'Sent by you with end-to-end encryption',
            });
        });

        it('should fall back to a blue lock when the email was not sent encrypted to some recipient', () => {
            const headers = {
                'X-Pm-Recipient-Authentication':
                    'test%40pm.me=pgp-pm;test2%40pm.me=pgp-inline;test3%40pm.me=pgp-eo;test4%40pm.me=none',
                'X-Pm-Recipient-Encryption':
                    'test%40pm.me=pgp-pm-pinned;test2%40pm.me=pgp-inline;test3%40pm.me=pgp-eo;test4%40pm.me=none',
                'X-Pm-Content-Encryption': 'end-to-end',
            };
            const icon = getIconFromHeaders(headers);
            expect(icon).toMatchObject({
                colorClassName: 'color-info',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.PLAIN,
                text: 'Stored with zero-access encryption',
            });
        });

        it('should fall back to a blue lock when some headers are missing', () => {
            const headers = {
                'X-Pm-Content-Encryption': 'end-to-end',
            };
            const icon = getIconFromHeaders(headers);
            expect(icon).toMatchObject({
                colorClassName: 'color-info',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.PLAIN,
                text: 'Stored with zero-access encryption',
            });
        });

        it('should fall back to a blue lock when there are no headers', () => {
            const headers = {};
            const icon = getIconFromHeaders(headers);
            expect(icon).toMatchObject({
                colorClassName: 'color-info',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.PLAIN,
                text: 'Stored with zero-access encryption',
            });
        });
    });

    describe('getReceivedStatusIcon', () => {
        it.each`
            origin        | encryption       | pinnedKeys    | verificationStatus    | colorClassName     | iconName                | text
            ${'internal'} | ${'on-delivery'} | ${[]}         | ${NOT_VERIFIED}       | ${'color-info'}    | ${'locks-closed'}       | ${'Sent by ProtonMail with zero-access encryption'}
            ${'internal'} | ${'end-to-end'}  | ${[]}         | ${NOT_SIGNED}         | ${'color-info'}    | ${'locks-closed'}       | ${'End-to-end encrypted message'}
            ${'internal'} | ${'end-to-end'}  | ${[fakeKey1]} | ${NOT_SIGNED}         | ${'color-info'}    | ${'locks-warning'}      | ${'Sender could not be verified: Message not signed'}
            ${'internal'} | ${'end-to-end'}  | ${[]}         | ${NOT_VERIFIED}       | ${'color-info'}    | ${'locks-closed'}       | ${'End-to-end encrypted and signed message'}
            ${'internal'} | ${'end-to-end'}  | ${[fakeKey1]} | ${SIGNED_AND_VALID}   | ${'color-info'}    | ${'locks-check'}        | ${'End-to-end encrypted message from verified sender'}
            ${'internal'} | ${'end-to-end'}  | ${[fakeKey1]} | ${SIGNED_AND_INVALID} | ${'color-info'}    | ${'locks-warning'}      | ${'Sender verification failed'}
            ${'external'} | ${'end-to-end'}  | ${[]}         | ${NOT_SIGNED}         | ${'color-success'} | ${'locks-closed'}       | ${'PGP-encrypted message'}
            ${'external'} | ${'end-to-end'}  | ${[]}         | ${NOT_VERIFIED}       | ${'color-success'} | ${'locks-signed'}       | ${'PGP-encrypted and signed message'}
            ${'external'} | ${'end-to-end'}  | ${[fakeKey1]} | ${SIGNED_AND_VALID}   | ${'color-success'} | ${'locks-check'}        | ${'PGP-encrypted message from verified sender'}
            ${'external'} | ${'end-to-end'}  | ${[fakeKey1]} | ${SIGNED_AND_INVALID} | ${'color-success'} | ${'locks-warning'}      | ${'Sender verification failed'}
            ${'external'} | ${'on-delivery'} | ${[]}         | ${NOT_VERIFIED}       | ${'color-success'} | ${'locks-open-signed'}  | ${'PGP-signed message'}
            ${'external'} | ${'on-delivery'} | ${[fakeKey1]} | ${SIGNED_AND_VALID}   | ${'color-success'} | ${'locks-open-check'}   | ${'PGP-signed message from verified sender'}
            ${'external'} | ${'on-delivery'} | ${[fakeKey1]} | ${SIGNED_AND_INVALID} | ${'color-success'} | ${'locks-open-warning'} | ${'PGP-signed message. Sender verification failed'}
            ${'external'} | ${'on-delivery'} | ${[]}         | ${NOT_SIGNED}         | ${'color-norm'}    | ${'locks-closed'}       | ${'Stored with zero-access encryption'}
        `(
            'should use color $colorClassName, lock $iconName when origin $origin, encryption $encryption and verification status $verificationStatus',
            ({ origin, encryption, pinnedKeys, verificationStatus, colorClassName, iconName, text }) => {
                const headers = {
                    'X-Pm-Origin': origin,
                    'X-Pm-Content-Encryption': encryption,
                } as any;
                const message = {
                    Time: SIGNATURE_START.USER + 10 * 1000,
                    ParsedHeaders: headers,
                } as Message;
                const verification = {
                    senderVerified: true,
                    senderPinnedKeys: pinnedKeys,
                    verificationStatus,
                } as MessageVerification;

                const icon = getReceivedStatusIcon(message, verification);
                const statusIconName = getStatusIconName(icon as StatusIcon);

                expect(icon?.colorClassName).toBe(colorClassName);
                expect(icon?.text).toBe(text);
                expect(statusIconName).toBe(iconName);
            }
        );
    });
});
