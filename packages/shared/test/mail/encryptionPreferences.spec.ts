import { OpenPGPKey } from 'pmcrypto';
import {
    CONTACT_MIME_TYPES,
    MIME_TYPES,
    MIME_TYPES_MORE,
    PACKAGE_TYPE,
    PGP_SCHEMES,
    PGP_SCHEMES_MORE,
    PGP_SIGN,
} from '../../lib/constants';
import { MailSettings, SelfSend } from '../../lib/interfaces';
import extractEncryptionPreferences, { ENCRYPTION_PREFERENCES_ERROR_TYPES } from '../../lib/mail/encryptionPreferences';

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
const pinnedFakeKey1: OpenPGPKey = {
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
const fakeKey2: OpenPGPKey = {
    getFingerprint() {
        return 'fakeKey2';
    },
    users: [
        {
            userId: {
                userid: '<user@tatoo.me>',
            },
        },
    ],
} as any;
const pinnedFakeKey2: OpenPGPKey = {
    getFingerprint() {
        return 'fakeKey2';
    },
    users: [
        {
            userId: {
                userid: '<user@tatoo.me>',
            },
        },
    ],
} as any;
const fakeKey3: OpenPGPKey = {
    getFingerprint() {
        return 'fakeKey3';
    },
} as any;
const pinnedFakeKey3: OpenPGPKey = {
    getFingerprint() {
        return 'fakeKey3';
    },
} as any;

describe('extractEncryptionPreferences for an internal user', () => {
    const model = {
        emailAddress: 'user@pm.me',
        publicKeys: { api: [], pinned: [] },
        scheme: PGP_SCHEMES_MORE.GLOBAL_DEFAULT,
        mimeType: MIME_TYPES_MORE.AUTOMATIC,
        trustedFingerprints: new Set([]),
        expiredFingerprints: new Set([]),
        revokedFingerprints: new Set([]),
        verifyOnlyFingerprints: new Set([]),
        isPGPExternal: false,
        isPGPInternal: true,
        isPGPExternalWithWKDKeys: false,
        isPGPExternalWithoutWKDKeys: false,
        pgpAddressDisabled: false,
        isContact: true,
        isContactSignatureVerified: true,
    };
    const mailSettings = {
        Sign: PGP_SIGN,
        PGPScheme: PACKAGE_TYPE.SEND_PGP_MIME,
        DraftMIMEType: MIME_TYPES.DEFAULT,
    } as MailSettings;

    it('should extract the primary API key when the email address does not belong to any contact', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [] as OpenPGPKey[];
        const publicKeyModel = {
            ...model,
            isContact: false,
            isContactSignatureVerified: undefined,
            publicKeys: { apiKeys, pinnedKeys },
            expiredFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            sendKey: fakeKey1,
            isSendKeyPinned: false,
            apiKeys,
            pinnedKeys,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: false,
            warnings: [],
            isContact: false,
            isContactSignatureVerified: undefined,
            emailAddressWarnings: undefined,
        });
    });

    it('should extract the primary API key when there are no pinned keys', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [] as OpenPGPKey[];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            expiredFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            sendKey: fakeKey1,
            isSendKeyPinned: false,
            apiKeys,
            pinnedKeys,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: false,
            warnings: [],
            isContact: true,
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined,
        });
    });

    it('should pick the pinned key (and not the API one)', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey2, pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey1', 'fakeKey2']),
            expiredFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            sendKey: pinnedFakeKey1,
            isSendKeyPinned: true,
            apiKeys,
            pinnedKeys,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: true,
            warnings: [],
            isContact: true,
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined,
        });
    });

    it('should give a warning for keyid mismatch', () => {
        const apiKeys = [fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey2];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey2']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result.warnings?.length).toEqual(1);
    });

    it('should give an error when the API gave emailAddress errors', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            verifyOnlyFingerprints: new Set(['fakeKey1']),
            emailAddressErrors: ['Recipient could not be found'],
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.EMAIL_ADDRESS_ERROR);
    });

    it('should give an error when the preferred pinned key is not valid for sending', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            verifyOnlyFingerprints: new Set(['fakeKey1']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_NOT_PINNED);
    });

    it('should give an error when the preferred pinned key is not among the keys returned by the API', () => {
        const apiKeys = [fakeKey1, fakeKey2];
        const pinnedKeys = [pinnedFakeKey3];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey3']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_NOT_PINNED);
    });

    it('should give an error if the API returned no keys', () => {
        const apiKeys = [] as OpenPGPKey[];
        const pinnedKeys = [pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey1']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.INTERNAL_USER_NO_API_KEY);
    });

    it('should give an error if the API returned no keys valid for sending', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey1']),
            expiredFingerprints: new Set(['fakeKey1']),
            revokedFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.INTERNAL_USER_NO_VALID_API_KEY);
    });

    it('should give an error if there are pinned keys but the contact signature could not be verified', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            isContactSignatureVerified: false,
            publicKeys: { apiKeys, pinnedKeys },
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.CONTACT_SIGNATURE_NOT_VERIFIED);
    });
});

describe('extractEncryptionPreferences for an external user with WKD keys', () => {
    const model = {
        emailAddress: 'user@pm.me',
        publicKeys: { apiKeys: [], pinnedKeys: [] },
        scheme: PGP_SCHEMES.PGP_INLINE,
        mimeType: MIME_TYPES.PLAINTEXT as CONTACT_MIME_TYPES,
        trustedFingerprints: new Set([]),
        expiredFingerprints: new Set([]),
        revokedFingerprints: new Set([]),
        verifyOnlyFingerprints: new Set([]),
        isPGPExternal: true,
        isPGPInternal: false,
        isPGPExternalWithWKDKeys: true,
        isPGPExternalWithoutWKDKeys: false,
        pgpAddressDisabled: false,
        isContact: true,
        isContactSignatureVerified: true,
    };
    const mailSettings = {
        Sign: 0,
        PGPScheme: PACKAGE_TYPE.SEND_PGP_MIME,
        DraftMIMEType: MIME_TYPES.DEFAULT,
    } as MailSettings;

    it('should extract the primary API key when the email address does not belong to any contact', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [] as OpenPGPKey[];
        const publicKeyModel = {
            ...model,
            isContact: false,
            isContactSignatureVerified: undefined,
            publicKeys: { apiKeys, pinnedKeys },
            expiredFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: MIME_TYPES.PLAINTEXT,
            scheme: PGP_SCHEMES.PGP_INLINE,
            sendKey: fakeKey1,
            isSendKeyPinned: false,
            apiKeys,
            pinnedKeys,
            isInternal: false,
            hasApiKeys: true,
            hasPinnedKeys: false,
            warnings: [],
            isContact: false,
            isContactSignatureVerified: undefined,
            emailAddressWarnings: undefined,
        });
    });

    it('should extract the primary API key when there are no pinned keys', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [] as OpenPGPKey[];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            expiredFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: MIME_TYPES.PLAINTEXT,
            scheme: PGP_SCHEMES.PGP_INLINE,
            sendKey: fakeKey1,
            isSendKeyPinned: false,
            apiKeys,
            pinnedKeys,
            isInternal: false,
            hasApiKeys: true,
            hasPinnedKeys: false,
            warnings: [],
            isContact: true,
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined,
        });
    });

    it('should pick the pinned key (and not the API one)', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey2, pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey1', 'fakeKey2']),
            expiredFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: MIME_TYPES.PLAINTEXT,
            scheme: PGP_SCHEMES.PGP_INLINE,
            sendKey: pinnedFakeKey1,
            isSendKeyPinned: true,
            apiKeys,
            pinnedKeys,
            isInternal: false,
            hasApiKeys: true,
            hasPinnedKeys: true,
            warnings: [],
            isContact: true,
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined,
        });
    });

    it('should give a warning for keyid mismatch', () => {
        const apiKeys = [fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey2];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey2']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result.warnings?.length).toEqual(1);
    });

    it('should give an error when the API gave emailAddress errors', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys: [fakeKey1, fakeKey2, fakeKey3], pinnedKeys: [pinnedFakeKey1] },
            verifyOnlyFingerprints: new Set(['fakeKey1']),
            emailAddressErrors: ['Recipient could not be found'],
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.EMAIL_ADDRESS_ERROR);
    });

    it('should give an error when the preferred pinned key is not valid for sending', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys: [fakeKey1, fakeKey2, fakeKey3], pinnedKeys: [pinnedFakeKey1] },
            verifyOnlyFingerprints: new Set(['fakeKey1']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_NOT_PINNED);
    });

    it('should give an error when the preferred pinned key is not among the keys returned by the API', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys: [fakeKey1, fakeKey2], pinnedKeys: [pinnedFakeKey3] },
            trustedFingerprints: new Set(['fakeKey3']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_NOT_PINNED);
    });

    it('should give an error if the API returned no keys valid for sending', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys: [fakeKey1, fakeKey2, fakeKey3], pinnedKeys: [pinnedFakeKey1] },
            trustedFingerprints: new Set(['fakeKey1']),
            expiredFingerprints: new Set(['fakeKey1']),
            revokedFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.WKD_USER_NO_VALID_WKD_KEY);
    });

    it('should give an error if there are pinned keys but the contact signature could not be verified', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            isContactSignatureVerified: false,
            publicKeys: { apiKeys, pinnedKeys },
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.CONTACT_SIGNATURE_NOT_VERIFIED);
    });
});

describe('extractEncryptionPreferences for an external user without WKD keys', () => {
    const model = {
        emailAddress: 'user@tatoo.me',
        publicKeys: { apiKeys: [], pinnedKeys: [] },
        encrypt: false,
        sign: false,
        scheme: PGP_SCHEMES_MORE.GLOBAL_DEFAULT,
        mimeType: MIME_TYPES_MORE.AUTOMATIC,
        trustedFingerprints: new Set([]),
        expiredFingerprints: new Set([]),
        revokedFingerprints: new Set([]),
        verifyOnlyFingerprints: new Set([]),
        isPGPExternal: true,
        isPGPInternal: false,
        isPGPExternalWithWKDKeys: false,
        isPGPExternalWithoutWKDKeys: true,
        pgpAddressDisabled: false,
        isContact: true,
        isContactSignatureVerified: true,
    };
    const mailSettings = {
        Sign: PGP_SIGN,
        PGPScheme: PACKAGE_TYPE.SEND_PGP_MIME,
        DraftMIMEType: MIME_TYPES.PLAINTEXT,
    } as MailSettings;

    it('should take into account the mail Settings', () => {
        const modelWithoutSign = { ...model, encrypt: undefined, sign: undefined };
        const result = extractEncryptionPreferences(modelWithoutSign, mailSettings);

        expect(result).toEqual({
            encrypt: false,
            sign: true,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            apiKeys: [],
            pinnedKeys: [],
            isInternal: false,
            hasApiKeys: false,
            hasPinnedKeys: false,
            isContact: true,
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined,
        });
    });

    it('should pick no key when the email address does not belong to any contact', () => {
        const result = extractEncryptionPreferences(
            {
                ...model,
                isContact: false,
                isContactSignatureVerified: undefined,
            },
            mailSettings
        );

        expect(result).toEqual({
            encrypt: false,
            sign: false,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            apiKeys: [],
            pinnedKeys: [],
            isInternal: false,
            hasApiKeys: false,
            hasPinnedKeys: false,
            isContact: false,
            isContactSignatureVerified: undefined,
            emailAddressWarnings: undefined,
        });
    });

    it('should pick no key when there are no pinned keys', () => {
        const result = extractEncryptionPreferences(model, mailSettings);

        expect(result).toEqual({
            encrypt: false,
            sign: false,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            apiKeys: [],
            pinnedKeys: [],
            isInternal: false,
            hasApiKeys: false,
            hasPinnedKeys: false,
            isContact: true,
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined,
        });
    });

    it('should pick the first pinned key', () => {
        const apiKeys = [] as OpenPGPKey[];
        const pinnedKeys = [pinnedFakeKey2, pinnedFakeKey3];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey2', 'fakeKey3']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: false,
            sign: false,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            sendKey: pinnedFakeKey2,
            isSendKeyPinned: true,
            apiKeys,
            pinnedKeys,
            isInternal: false,
            hasApiKeys: false,
            hasPinnedKeys: true,
            warnings: [],
            isContact: true,
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined,
        });
    });

    it('should give a warning for keyid mismatch', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys: [], pinnedKeys: [pinnedFakeKey1] },
            trustedFingerprints: new Set(['fakeKey1']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result.warnings?.length).toEqual(1);
    });

    it('should give an error when the preferred pinned key is not valid for sending', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys: [], pinnedKeys: [pinnedFakeKey2, pinnedFakeKey1] },
            expiredFingerprints: new Set(['fakeKey1']),
            revokedFingerprints: new Set(['fakeKey2']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.EXTERNAL_USER_NO_VALID_PINNED_KEY);
    });

    it('should give an error if there are pinned keys but the contact signature could not be verified', () => {
        const publicKeyModel = {
            ...model,
            isContactSignatureVerified: false,
            publicKeys: { apiKeys: [], pinnedKeys: [pinnedFakeKey2, pinnedFakeKey1] },
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.CONTACT_SIGNATURE_NOT_VERIFIED);
    });
});

describe('extractEncryptionPreferences for an own address', () => {
    const apiKeys = [fakeKey1, fakeKey2];
    const pinnedKeys = [] as OpenPGPKey[];
    const model = {
        emailAddress: 'user@pm.me',
        publicKeys: { apiKeys, pinnedKeys },
        mimeType: MIME_TYPES_MORE.AUTOMATIC,
        scheme: PGP_SCHEMES_MORE.GLOBAL_DEFAULT,
        trustedFingerprints: new Set([]),
        expiredFingerprints: new Set([]),
        revokedFingerprints: new Set([]),
        verifyOnlyFingerprints: new Set([]),
        isPGPExternal: false,
        isPGPInternal: true,
        isPGPExternalWithWKDKeys: false,
        isPGPExternalWithoutWKDKeys: false,
        pgpAddressDisabled: false,
        isContact: false,
        emailAddressWarnings: undefined,
    };
    const mailSettings = {
        Sign: PGP_SIGN,
        PGPScheme: PACKAGE_TYPE.SEND_PGP_MIME,
        DraftMIMEType: MIME_TYPES.PLAINTEXT,
    } as MailSettings;

    it('should not pick the public key from the keys in selfSend.address', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 1,
                Receive: 1,
            },
            publicKey: pinnedFakeKey1,
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            sendKey: pinnedFakeKey1,
            isSendKeyPinned: false,
            apiKeys,
            pinnedKeys,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: false,
            warnings: [],
            isContact: false,
            isContactSignatureVerified: undefined,
            emailAddressWarnings: undefined,
        });
    });

    it('should give a warning for keyid mismatch', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 1,
                Receive: 1,
            },
            publicKey: pinnedFakeKey2,
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result.warnings?.length).toEqual(1);
    });

    it('should give an error when the address is disabled', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 1,
                Receive: 0,
            },
            publicKey: pinnedFakeKey1,
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.INTERNAL_USER_DISABLED);
    });

    it('should give an error when the API returned no keys for the address', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 0,
                Receive: 1,
            },
            publicKey: pinnedFakeKey1,
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.INTERNAL_USER_NO_API_KEY);
    });

    it('should give an error when no public key (from the decypted private key) was received', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 1,
                Receive: 1,
            },
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.INTERNAL_USER_NO_VALID_API_KEY);
    });
});
