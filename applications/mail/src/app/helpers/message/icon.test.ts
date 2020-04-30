import { EncryptionPreferencesFailureTypes } from 'proton-shared/lib/mail/encryptionPreferences';
import { STATUS_ICONS_FILLS } from '../../models/crypto';
import { getSendStatusIcon } from './icon';
import { MIME_TYPES, PACKAGE_TYPE } from 'proton-shared/lib/constants';

describe('icon', () => {
    describe('getSendStatusIcon', () => {
        it('should return a blue plain lock when sending to internal users without pinned keys', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PM,
                mimetype: MIME_TYPES.DEFAULT,
                hasApiKeys: true,
                hasPinnedKeys: false,
                isPublicKeyPinned: false
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-pm-blue',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.PLAIN,
                text: 'End-to-end encrypted'
            });
        });

        it('should return a blue lock with checkmark when sending to internal users with a pinned key', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PM,
                mimetype: MIME_TYPES.DEFAULT,
                hasApiKeys: true,
                hasPinnedKeys: true,
                isPublicKeyPinned: true
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-pm-blue',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.CHECKMARK,
                text: 'End-to-end encrypted to verified recipient'
            });
        });

        it('should return a failure sign when sending to internal users with pinned keys, but the pinned key is not used', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PM,
                mimetype: MIME_TYPES.DEFAULT,
                hasApiKeys: true,
                hasPinnedKeys: true,
                isPublicKeyPinned: false,
                failure: {
                    type: EncryptionPreferencesFailureTypes.INTERNAL_USER_PRIMARY_NOT_PINNED,
                    error: Error('test error')
                }
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-global-warning',
                isEncrypted: false,
                fill: STATUS_ICONS_FILLS.FAIL,
                text: 'test error'
            });
        });

        it('should return a green plain lock when sending to WKD users without pinned keys', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_INLINE,
                mimetype: MIME_TYPES.PLAINTEXT,
                hasApiKeys: true,
                hasPinnedKeys: false,
                isPublicKeyPinned: false
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.PLAIN,
                text: 'End-to-end encrypted'
            });
        });

        it('should return a green lock with checkmark when sending to WKD users with a pinned key', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                mimetype: MIME_TYPES.MIME,
                hasApiKeys: true,
                hasPinnedKeys: true,
                isPublicKeyPinned: true
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.CHECKMARK,
                text: 'End-to-end encrypted to verified recipient'
            });
        });

        it('should return a failure sign when sending to WKD users with pinned keys, but the pinned key is not used', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                mimetype: MIME_TYPES.MIME,
                hasApiKeys: true,
                hasPinnedKeys: true,
                isPublicKeyPinned: false,
                failure: {
                    type: EncryptionPreferencesFailureTypes.WKD_USER_PRIMARY_NOT_PINNED,
                    error: Error('test error')
                }
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-global-warning',
                isEncrypted: false,
                fill: STATUS_ICONS_FILLS.FAIL,
                text: 'test error'
            });
        });

        it('should return a green lock with warning sign when sending to WKD users without pinned keys with warnings', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                mimetype: MIME_TYPES.MIME,
                hasApiKeys: true,
                hasPinnedKeys: false,
                isPublicKeyPinned: false,
                warnings: ['warning test 1', 'warning test 2']
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.WARNING,
                text: "End-to-end encrypted. Recipient's key validation failed: warning test 1; warning test 2"
            });
        });

        it('should return a green lock with warning sign when sending to WKD users with pinned keys with warnings', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                mimetype: MIME_TYPES.MIME,
                hasApiKeys: true,
                hasPinnedKeys: true,
                isPublicKeyPinned: true,
                warnings: ['warning test 1', 'warning test 2']
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.WARNING,
                text: "End-to-end encrypted. Recipient's key validation failed: warning test 1; warning test 2"
            });
        });

        it('should return a green open lock for external PGP messages only signed', () => {
            const sendPreferences = {
                encrypt: false,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                mimetype: MIME_TYPES.MIME,
                hasApiKeys: false,
                hasPinnedKeys: false
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-global-success',
                isEncrypted: false,
                fill: STATUS_ICONS_FILLS.SIGN,
                text: 'PGP-signed'
            });
        });

        it('should return a green lock with pencil sign for external PGP-encrypted (and signed) messages', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_INLINE,
                mimetype: MIME_TYPES.PLAINTEXT,
                hasApiKeys: false,
                hasPinnedKeys: true,
                isPublicKeyPinned: false
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.SIGN,
                text: 'PGP-encrypted'
            });
        });

        it('should return a green lock with checkmark for external PGP messages if encrypted with a pinned key', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                mimetype: MIME_TYPES.MIME,
                hasApiKeys: false,
                hasPinnedKeys: true,
                isPublicKeyPinned: true
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.CHECKMARK,
                text: 'PGP-encrypted to verified recipient'
            });
        });

        it('should return a green lock with warning sign for external PGP messages with warnings on the pinned key', () => {
            const sendPreferences = {
                encrypt: true,
                sign: true,
                pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                mimetype: MIME_TYPES.MIME,
                hasApiKeys: false,
                hasPinnedKeys: true,
                isPublicKeyPinned: true,
                warnings: ['warning test 1', 'warning test 2']
            };
            expect(getSendStatusIcon(sendPreferences)).toMatchObject({
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: STATUS_ICONS_FILLS.WARNING,
                text: "PGP-encrypted. Recipient's key validation failed: warning test 1; warning test 2"
            });
        });

        it('should return nothing when sending unencrypted and unsigned', () => {
            const sendPreferences = {
                encrypt: false,
                sign: false,
                pgpScheme: PACKAGE_TYPE.SEND_CLEAR,
                mimetype: MIME_TYPES.MIME,
                hasApiKeys: false,
                hasPinnedKeys: false,
                isPublicKeyPinned: false
            };
            expect(getSendStatusIcon(sendPreferences)).toBeUndefined();
        });
    });
});
