import { OpenPGPKey } from 'pmcrypto';
import {
    CONTACT_MIME_TYPES,
    DRAFT_MIME_TYPES,
    MIME_TYPES_MORE,
    PACKAGE_TYPE,
    PGP_SCHEMES,
    PGP_SCHEMES_MORE,
    PGP_SIGN
} from '../../lib/constants';
import { MailSettings, SelfSend } from '../../lib/interfaces';
import extractEncryptionPreferences, { EncryptionPreferencesFailureTypes } from '../../lib/mail/encryptionPreferences';

const fakeKey1: OpenPGPKey = {
    getFingerprint() {
        return 'fakeKey1';
    },
    users: [
        {
            userId: {
                userid: '<user@pm.me>'
            }
        }
    ]
} as any;
const pinnedFakeKey1: OpenPGPKey = {
    getFingerprint() {
        return 'fakeKey1';
    },
    users: [
        {
            userId: {
                userid: '<user@pm.me>'
            }
        }
    ]
} as any;
const fakeKey2: OpenPGPKey = {
    getFingerprint() {
        return 'fakeKey2';
    },
    users: [
        {
            userId: {
                userid: '<user@tatoo.me>'
            }
        }
    ]
} as any;
const pinnedFakeKey2: OpenPGPKey = {
    getFingerprint() {
        return 'fakeKey2';
    },
    users: [
        {
            userId: {
                userid: '<user@tatoo.me>'
            }
        }
    ]
} as any;
const fakeKey3: OpenPGPKey = {
    getFingerprint() {
        return 'fakeKey3';
    }
} as any;
const pinnedFakeKey3: OpenPGPKey = {
    getFingerprint() {
        return 'fakeKey3';
    }
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
        isContactSignatureVerified: true
    };
    const mailSettings = {
        Sign: PGP_SIGN,
        PGPScheme: PACKAGE_TYPE.SEND_PGP_MIME,
        DraftMIMEType: DRAFT_MIME_TYPES.DEFAULT
    } as MailSettings;

    it('should extract the primary API key when there are no pinned keys', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [] as OpenPGPKey[];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            expiredFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.DEFAULT,
            scheme: PGP_SCHEMES.PGP_MIME,
            sendKey: fakeKey1,
            isSendKeyPinned: false,
            apiKeys,
            pinnedKeys,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: false,
            warnings: [],
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined
        });
    });

    it('should pick the pinned key (and not the API one)', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey1, pinnedFakeKey2];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey1', 'fakeKey2']),
            expiredFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.DEFAULT,
            scheme: PGP_SCHEMES.PGP_MIME,
            sendKey: pinnedFakeKey1,
            isSendKeyPinned: true,
            apiKeys,
            pinnedKeys,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: true,
            warnings: [],
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined
        });
    });

    it('should give a warning for keyid mismatch', () => {
        const apiKeys = [fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey2];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey2'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result.warnings?.length).toEqual(1);
    });

    it('should give a failure when the API gave emailAddress errors', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            verifyOnlyFingerprints: new Set(['fakeKey1']),
            emailAddressErrors: ['Recipient could not be found']
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.EMAIL_ADDRESS_ERROR);
    });

    it('should give a failure when the preferred pinned key is not valid for sending', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            verifyOnlyFingerprints: new Set(['fakeKey1'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.INTERNAL_USER_PRIMARY_NOT_PINNED);
    });

    it('should give a failure when the preferred pinned key is not among the keys returned by the API', () => {
        const apiKeys = [fakeKey1, fakeKey2];
        const pinnedKeys = [pinnedFakeKey3];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.INTERNAL_USER_PRIMARY_NOT_PINNED);
    });

    it('should give a failure if the API returned no keys', () => {
        const apiKeys = [] as OpenPGPKey[];
        const pinnedKeys = [pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey1'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.INTERNAL_USER_NO_API_KEY);
    });

    it('should give a failure if the API returned no keys valid for sending', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey1']),
            expiredFingerprints: new Set(['fakeKey1']),
            revokedFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.INTERNAL_USER_NO_VALID_API_KEY);
    });
});

describe('extractEncryptionPreferences for an external user with WKD keys', () => {
    const model = {
        emailAddress: 'user@pm.me',
        publicKeys: { apiKeys: [], pinnedKeys: [] },
        scheme: PGP_SCHEMES.PGP_INLINE,
        mimeType: DRAFT_MIME_TYPES.PLAINTEXT as CONTACT_MIME_TYPES,
        trustedFingerprints: new Set([]),
        expiredFingerprints: new Set([]),
        revokedFingerprints: new Set([]),
        verifyOnlyFingerprints: new Set([]),
        isPGPExternal: true,
        isPGPInternal: false,
        isPGPExternalWithWKDKeys: true,
        isPGPExternalWithoutWKDKeys: false,
        pgpAddressDisabled: false,
        isContactSignatureVerified: true
    };
    const mailSettings = {
        Sign: 0,
        PGPScheme: PACKAGE_TYPE.SEND_PGP_MIME,
        DraftMIMEType: DRAFT_MIME_TYPES.DEFAULT
    } as MailSettings;

    it('should extract the primary API key when there are no pinned keys', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [] as OpenPGPKey[];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            expiredFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.PLAINTEXT,
            scheme: PGP_SCHEMES.PGP_INLINE,
            sendKey: fakeKey1,
            isSendKeyPinned: false,
            apiKeys,
            pinnedKeys,
            isInternal: false,
            hasApiKeys: true,
            hasPinnedKeys: false,
            warnings: [],
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined
        });
    });

    it('should pick the pinned key (and not the API one)', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey1, pinnedFakeKey2];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey1', 'fakeKey2']),
            expiredFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.PLAINTEXT,
            scheme: PGP_SCHEMES.PGP_INLINE,
            sendKey: pinnedFakeKey1,
            isSendKeyPinned: true,
            apiKeys,
            pinnedKeys,
            isInternal: false,
            hasApiKeys: true,
            hasPinnedKeys: true,
            warnings: [],
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined
        });
    });

    it('should give a warning for keyid mismatch', () => {
        const apiKeys = [fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey2];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey2'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result.warnings?.length).toEqual(1);
    });

    it('should give a failure when the API gave emailAddress errors', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys: [fakeKey1, fakeKey2, fakeKey3], pinnedKeys: [pinnedFakeKey1] },
            verifyOnlyFingerprints: new Set(['fakeKey1']),
            emailAddressErrors: ['Recipient could not be found']
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.EMAIL_ADDRESS_ERROR);
    });

    it('should give a failure when the preferred pinned key is not valid for sending', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys: [fakeKey1, fakeKey2, fakeKey3], pinnedKeys: [pinnedFakeKey1] },
            verifyOnlyFingerprints: new Set(['fakeKey1'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.WKD_USER_PRIMARY_NOT_PINNED);
    });

    it('should give a failure when the preferred pinned key is not among the keys returned by the API', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys: [fakeKey1, fakeKey2], pinnedKeys: [pinnedFakeKey3] },
            trustedFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.WKD_USER_PRIMARY_NOT_PINNED);
    });

    it('should give a failure if the API returned no keys valid for sending', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys: [fakeKey1, fakeKey2, fakeKey3], pinnedKeys: [pinnedFakeKey1] },
            trustedFingerprints: new Set(['fakeKey1']),
            expiredFingerprints: new Set(['fakeKey1']),
            revokedFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.WKD_USER_NO_VALID_WKD_KEY);
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
        isContactSignatureVerified: true
    };
    const mailSettings = {
        Sign: PGP_SIGN,
        PGPScheme: PACKAGE_TYPE.SEND_PGP_MIME,
        DraftMIMEType: DRAFT_MIME_TYPES.PLAINTEXT
    } as MailSettings;

    it('should take into account the mail Settings', () => {
        const modelWithoutSign = { ...model, encrypt: undefined, sign: undefined };
        const result = extractEncryptionPreferences(modelWithoutSign, mailSettings);

        expect(result).toEqual({
            encrypt: false,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.PLAINTEXT,
            scheme: PGP_SCHEMES.PGP_MIME,
            apiKeys: [],
            pinnedKeys: [],
            isInternal: false,
            hasApiKeys: false,
            hasPinnedKeys: false,
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined
        });
    });

    it('should pick no key when there are no pinned keys', () => {
        const result = extractEncryptionPreferences(model, mailSettings);

        expect(result).toEqual({
            encrypt: false,
            sign: false,
            mimeType: DRAFT_MIME_TYPES.PLAINTEXT,
            scheme: PGP_SCHEMES.PGP_MIME,
            apiKeys: [],
            pinnedKeys: [],
            isInternal: false,
            hasApiKeys: false,
            hasPinnedKeys: false,
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined
        });
    });

    it('should pick the first pinned key', () => {
        const apiKeys = [] as OpenPGPKey[];
        const pinnedKeys = [pinnedFakeKey2, pinnedFakeKey3];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys },
            trustedFingerprints: new Set(['fakeKey2', 'fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: false,
            sign: false,
            mimeType: DRAFT_MIME_TYPES.PLAINTEXT,
            scheme: PGP_SCHEMES.PGP_MIME,
            sendKey: pinnedFakeKey2,
            isSendKeyPinned: true,
            apiKeys,
            pinnedKeys,
            isInternal: false,
            hasApiKeys: false,
            hasPinnedKeys: true,
            warnings: [],
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined
        });
    });

    it('should give a warning for keyid mismatch', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys: [], pinnedKeys: [pinnedFakeKey1] },
            trustedFingerprints: new Set(['fakeKey1'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result.warnings?.length).toEqual(1);
    });

    it('should give a failure when the preferred pinned key is not valid for sending', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys: [], pinnedKeys: [pinnedFakeKey1, pinnedFakeKey2] },
            expiredFingerprints: new Set(['fakeKey1']),
            revokedFingerprints: new Set(['fakeKey2'])
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.EXTERNAL_USER_NO_VALID_PINNED_KEY);
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
        isContactSignatureVerified: true,
        emailAddressWarnings: undefined
    };
    const mailSettings = {
        Sign: PGP_SIGN,
        PGPScheme: PACKAGE_TYPE.SEND_PGP_MIME,
        DraftMIMEType: DRAFT_MIME_TYPES.PLAINTEXT
    } as MailSettings;

    it('should not pick the public key from the keys in selfSend.address', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 1,
                Receive: 1
            },
            publicKey: pinnedFakeKey1
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.PLAINTEXT,
            scheme: PGP_SCHEMES.PGP_MIME,
            sendKey: pinnedFakeKey1,
            isSendKeyPinned: false,
            apiKeys,
            pinnedKeys,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: false,
            warnings: [],
            isContactSignatureVerified: true,
            emailAddressWarnings: undefined
        });
    });

    it('should give a warning for keyid mismatch', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 1,
                Receive: 1
            },
            publicKey: pinnedFakeKey2
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result.warnings?.length).toEqual(1);
    });

    it('should give a failure when the address is disabled', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 1,
                Receive: 0
            },
            publicKey: pinnedFakeKey1
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.INTERNAL_USER_DISABLED);
    });

    it('should give a failure when the API returned no keys for the address', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 0,
                Receive: 1
            },
            publicKey: pinnedFakeKey1
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.INTERNAL_USER_NO_API_KEY);
    });

    it('should give a failure when no public key (from the decypted private key) was received', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 1,
                Receive: 1
            }
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.INTERNAL_USER_NO_VALID_API_KEY);
    });
});
