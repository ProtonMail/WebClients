import { OpenPGPKey } from 'pmcrypto';
import { DRAFT_MIME_TYPES, PGP_SCHEMES } from '../../lib/constants';
import { SelfSend } from '../../lib/interfaces';
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
        encrypt: true,
        sign: true,
        mimeType: DRAFT_MIME_TYPES.DEFAULT,
        scheme: PGP_SCHEMES.PGP_MIME,
        trustedFingerprints: new Set([]),
        expiredFingerprints: new Set([]),
        revokedFingerprints: new Set([]),
        verifyOnlyFingerprints: new Set([]),
        isPGPExternal: false,
        isPGPInternal: true,
        isPGPExternalWithWKDKeys: false,
        isPGPExternalWithoutWKDKeys: false,
        pgpAddressDisabled: false
    };

    it('should extract the primary API key when there are no pinned keys', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [fakeKey1, fakeKey2, fakeKey3], pinned: [] },
            expiredFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.DEFAULT,
            scheme: PGP_SCHEMES.PGP_MIME,
            publicKey: fakeKey1,
            isPublicKeyPinned: false,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: false,
            warnings: []
        });
    });

    it('should pick the pinned key (and not the API one)', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [fakeKey1, fakeKey2, fakeKey3], pinned: [pinnedFakeKey1, pinnedFakeKey2] },
            trustedFingerprints: new Set(['fakeKey1', 'fakeKey2']),
            expiredFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.DEFAULT,
            scheme: PGP_SCHEMES.PGP_MIME,
            publicKey: pinnedFakeKey1,
            isPublicKeyPinned: true,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: true,
            warnings: []
        });
    });

    it('should give a warning for keyid mismatch', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [fakeKey2, fakeKey3], pinned: [pinnedFakeKey2] },
            trustedFingerprints: new Set(['fakeKey2'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result.warnings?.length).toEqual(1);
    });

    it('should give a failure when the preferred pinned key is not valid for sending', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [fakeKey1, fakeKey2, fakeKey3], pinned: [pinnedFakeKey1] },
            verifyOnlyFingerprints: new Set(['fakeKey1'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.INTERNAL_USER_PRIMARY_NOT_PINNED);
    });

    it('should give a failure when the preferred pinned key is not among the keys returned by the API', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [fakeKey1, fakeKey2], pinned: [pinnedFakeKey3] },
            trustedFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.INTERNAL_USER_PRIMARY_NOT_PINNED);
    });

    it('should give a failure if the API returned no keys', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [], pinned: [pinnedFakeKey1] },
            trustedFingerprints: new Set(['fakeKey1'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.INTERNAL_USER_NO_API_KEY);
    });

    it('should give a failure if the API returned no keys valid for sending', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [fakeKey1, fakeKey2, fakeKey3], pinned: [pinnedFakeKey1] },
            trustedFingerprints: new Set(['fakeKey1']),
            expiredFingerprints: new Set(['fakeKey1']),
            revokedFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.INTERNAL_USER_NO_VALID_API_KEY);
    });
});

describe('extractEncryptionPreferences for an external user with WKD keys', () => {
    const model = {
        emailAddress: 'user@pm.me',
        publicKeys: { api: [], pinned: [] },
        encrypt: true,
        sign: true,
        mimeType: DRAFT_MIME_TYPES.DEFAULT,
        scheme: PGP_SCHEMES.PGP_MIME,
        trustedFingerprints: new Set([]),
        expiredFingerprints: new Set([]),
        revokedFingerprints: new Set([]),
        verifyOnlyFingerprints: new Set([]),
        isPGPExternal: true,
        isPGPInternal: false,
        isPGPExternalWithWKDKeys: true,
        isPGPExternalWithoutWKDKeys: false,
        pgpAddressDisabled: false
    };

    it('should extract the primary API key when there are no pinned keys', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [fakeKey1, fakeKey2, fakeKey3], pinned: [] },
            expiredFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.DEFAULT,
            scheme: PGP_SCHEMES.PGP_MIME,
            publicKey: fakeKey1,
            isPublicKeyPinned: false,
            isInternal: false,
            hasApiKeys: true,
            hasPinnedKeys: false,
            warnings: []
        });
    });

    it('should pick the pinned key (and not the API one)', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [fakeKey1, fakeKey2, fakeKey3], pinned: [pinnedFakeKey1, pinnedFakeKey2] },
            trustedFingerprints: new Set(['fakeKey1', 'fakeKey2']),
            expiredFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.DEFAULT,
            scheme: PGP_SCHEMES.PGP_MIME,
            publicKey: pinnedFakeKey1,
            isPublicKeyPinned: true,
            isInternal: false,
            hasApiKeys: true,
            hasPinnedKeys: true,
            warnings: []
        });
    });

    it('should give a warning for keyid mismatch', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [fakeKey2, fakeKey3], pinned: [pinnedFakeKey2] },
            trustedFingerprints: new Set(['fakeKey2'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result.warnings?.length).toEqual(1);
    });

    it('should give a failure when the preferred pinned key is not valid for sending', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [fakeKey1, fakeKey2, fakeKey3], pinned: [pinnedFakeKey1] },
            verifyOnlyFingerprints: new Set(['fakeKey1'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.WKD_USER_PRIMARY_NOT_PINNED);
    });

    it('should give a failure when the preferred pinned key is not among the keys returned by the API', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [fakeKey1, fakeKey2], pinned: [pinnedFakeKey3] },
            trustedFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.WKD_USER_PRIMARY_NOT_PINNED);
    });

    it('should give a failure if the API returned no keys valid for sending', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [fakeKey1, fakeKey2, fakeKey3], pinned: [pinnedFakeKey1] },
            trustedFingerprints: new Set(['fakeKey1']),
            expiredFingerprints: new Set(['fakeKey1']),
            revokedFingerprints: new Set(['fakeKey2']),
            verifyOnlyFingerprints: new Set(['fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.WKD_USER_NO_VALID_WKD_KEY);
    });
});

describe('extractEncryptionPreferences for an external user without WKD keys', () => {
    const model = {
        emailAddress: 'user@tatoo.me',
        publicKeys: { api: [], pinned: [] },
        encrypt: false,
        sign: true,
        mimeType: DRAFT_MIME_TYPES.DEFAULT,
        scheme: PGP_SCHEMES.PGP_MIME,
        trustedFingerprints: new Set([]),
        expiredFingerprints: new Set([]),
        revokedFingerprints: new Set([]),
        verifyOnlyFingerprints: new Set([]),
        isPGPExternal: true,
        isPGPInternal: false,
        isPGPExternalWithWKDKeys: false,
        isPGPExternalWithoutWKDKeys: true,
        pgpAddressDisabled: false
    };

    it('should pick no key when there are no pinned keys', () => {
        const result = extractEncryptionPreferences(model);

        expect(result).toEqual({
            encrypt: false,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.DEFAULT,
            scheme: PGP_SCHEMES.PGP_MIME,
            isInternal: false,
            hasApiKeys: false,
            hasPinnedKeys: false
        });
    });

    it('should pick the first pinned key', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [], pinned: [pinnedFakeKey2, pinnedFakeKey3] },
            trustedFingerprints: new Set(['fakeKey2', 'fakeKey3'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result).toEqual({
            encrypt: false,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.DEFAULT,
            scheme: PGP_SCHEMES.PGP_MIME,
            publicKey: pinnedFakeKey2,
            isPublicKeyPinned: true,
            isInternal: false,
            hasApiKeys: false,
            hasPinnedKeys: true,
            warnings: []
        });
    });

    it('should give a warning for keyid mismatch', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [], pinned: [pinnedFakeKey1] },
            trustedFingerprints: new Set(['fakeKey1'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result.warnings?.length).toEqual(1);
    });

    it('should give a failure when the preferred pinned key is not valid for sending', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { api: [], pinned: [pinnedFakeKey1, pinnedFakeKey2] },
            expiredFingerprints: new Set(['fakeKey1']),
            revokedFingerprints: new Set(['fakeKey2'])
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.EXTERNAL_USER_NO_VALID_PINNED_KEY);
    });
});

describe('extractEncryptionPreferences for an own address', () => {
    const model = {
        emailAddress: 'user@pm.me',
        publicKeys: { api: [fakeKey1, fakeKey2], pinned: [] },
        encrypt: true,
        sign: true,
        mimeType: DRAFT_MIME_TYPES.DEFAULT,
        scheme: PGP_SCHEMES.PGP_MIME,
        trustedFingerprints: new Set([]),
        expiredFingerprints: new Set([]),
        revokedFingerprints: new Set([]),
        verifyOnlyFingerprints: new Set([]),
        isPGPExternal: false,
        isPGPInternal: true,
        isPGPExternalWithWKDKeys: false,
        isPGPExternalWithoutWKDKeys: false,
        pgpAddressDisabled: false
    };

    it('should not pick the public key from the keys in selfSend.address', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 1,
                Receive: 1
            },
            publicKey: pinnedFakeKey1
        } as any;
        const result = extractEncryptionPreferences(model, selfSend);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.DEFAULT,
            scheme: PGP_SCHEMES.PGP_MIME,
            publicKey: pinnedFakeKey1,
            isPublicKeyPinned: false,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: false,
            warnings: []
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
        const result = extractEncryptionPreferences(model, selfSend);

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
        const result = extractEncryptionPreferences(model, selfSend);

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
        const result = extractEncryptionPreferences(model, selfSend);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.INTERNAL_USER_NO_API_KEY);
    });

    it('should give a failure when no public key (from the decypted private key) was received', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 1,
                Receive: 1
            }
        } as any;
        const result = extractEncryptionPreferences(model, selfSend);

        expect(result?.failure?.type).toEqual(EncryptionPreferencesFailureTypes.INTERNAL_USER_NO_VALID_API_KEY);
    });
});
