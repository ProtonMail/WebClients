import { CryptoProxy, PublicKeyReference } from '@proton/crypto';

import { RECIPIENT_TYPES } from '../../lib/constants';
import { getContactPublicKeyModel, sortApiKeys, sortPinnedKeys } from '../../lib/keys/publicKeys';
import { ExpiredPublicKey, SignOnlyPublicKey, ValidPublicKey } from './keys.data';

describe('get contact public key model', () => {
    const publicKeyConfig = {
        emailAddress: '',
        apiKeysConfig: {
            Keys: [],
            publicKeys: [],
        },
    };

    it('should mark valid key as capable of encryption', async () => {
        const publicKey = await CryptoProxy.importPublicKey({ armoredKey: ValidPublicKey });
        const contactModel = await getContactPublicKeyModel({
            ...publicKeyConfig,
            pinnedKeysConfig: {
                pinnedKeys: [publicKey],
                isContact: true,
            },
        });
        const fingerprint = publicKey.getFingerprint();
        expect(contactModel.encryptionCapableFingerprints.has(fingerprint)).toBeTrue();
    });

    it('should mark expired key as incapable of encryption', async () => {
        const publicKey = await CryptoProxy.importPublicKey({ armoredKey: ExpiredPublicKey });
        const contactModel = await getContactPublicKeyModel({
            ...publicKeyConfig,
            pinnedKeysConfig: {
                pinnedKeys: [publicKey],
                isContact: true,
            },
        });
        const fingerprint = publicKey.getFingerprint();
        expect(contactModel.encryptionCapableFingerprints.has(fingerprint)).toBeFalse();
    });

    it('should mark sign-only as incapable of encryption', async () => {
        const publicKey = await CryptoProxy.importPublicKey({ armoredKey: SignOnlyPublicKey });
        const contactModel = await getContactPublicKeyModel({
            ...publicKeyConfig,
            pinnedKeysConfig: {
                pinnedKeys: [publicKey],
                isContact: true,
            },
        });
        const fingerprint = publicKey.getFingerprint();
        expect(contactModel.encryptionCapableFingerprints.has(fingerprint)).toBeFalse();
    });

    it('should determine encryption flag based on `encryptToPinned` when pinned keys are present', async () => {
        const publicKey = await CryptoProxy.importPublicKey({ armoredKey: ValidPublicKey });
        const contactModel = await getContactPublicKeyModel({
            ...publicKeyConfig,
            apiKeysConfig: {
                publicKeys: [{ publicKey, armoredKey: '', flags: 0 }],
            },
            pinnedKeysConfig: {
                pinnedKeys: [publicKey],
                encryptToPinned: false,
                encryptToUntrusted: true,
                isContact: true,
            },
        });
        expect(contactModel.encrypt).toBeFalse();
    });

    it('should determine encryption flag based on `encryptToUntrusted` when only API keys are present', async () => {
        const publicKey = await CryptoProxy.importPublicKey({ armoredKey: ValidPublicKey });
        const contactModel = await getContactPublicKeyModel({
            ...publicKeyConfig,
            apiKeysConfig: {
                publicKeys: [{ publicKey, armoredKey: '', flags: 0 }],
            },
            pinnedKeysConfig: {
                pinnedKeys: [],
                encryptToPinned: false,
                encryptToUntrusted: true,
                isContact: true,
            },
        });
        expect(contactModel.encrypt).toBeTrue();
    });

    it('should set the encryption flag when pinned keys are present and `encryptToPinned` is missing', async () => {
        const publicKey = await CryptoProxy.importPublicKey({ armoredKey: ValidPublicKey });
        const contactModel = await getContactPublicKeyModel({
            ...publicKeyConfig,
            apiKeysConfig: {
                publicKeys: [{ publicKey, armoredKey: '', flags: 0 }],
            },
            pinnedKeysConfig: {
                pinnedKeys: [publicKey],
                // encryptToPinned: undefined,
                encryptToUntrusted: false,
                isContact: true,
            },
        });
        expect(contactModel.encrypt).toBeTrue();
    });

    it('should not determine encryption flag based on `encryptToUntrusted` if API keys are missing', async () => {
        const contactModel = await getContactPublicKeyModel({
            ...publicKeyConfig,
            apiKeysConfig: {
                publicKeys: [],
            },
            pinnedKeysConfig: {
                pinnedKeys: [],
                // encryptToPinned: undefined,
                encryptToUntrusted: true,
                isContact: true,
            },
        });
        expect(contactModel.encrypt).toBeUndefined();
    });

    it('should not determine encryption flag based on `encryptToUntrusted` for internal users', async () => {
        const publicKey = await CryptoProxy.importPublicKey({ armoredKey: ValidPublicKey });
        const contactModel = await getContactPublicKeyModel({
            ...publicKeyConfig,
            apiKeysConfig: {
                ...publicKeyConfig,
                RecipientType: RECIPIENT_TYPES.TYPE_INTERNAL,
                publicKeys: [{ publicKey, armoredKey: '', flags: 0 }],
            },
            pinnedKeysConfig: {
                pinnedKeys: [publicKey],
                // encryptToPinned: undefined,
                encryptToUntrusted: false,
                isContact: true,
            },
        });
        expect(contactModel.encrypt).toBeTrue();
    });
});

describe('sortApiKeys', () => {
    const generateFakeKey = (fingerprint: string) =>
        ({
            getFingerprint() {
                return fingerprint;
            },
        } as PublicKeyReference);
    it('sort keys as expected', () => {
        const fingerprints = [
            'trustedObsoleteNotCompromised',
            'notTrustedObsoleteCompromised',
            'trustedNotObsoleteNotCompromised',
            'notTrustedNotObsoleteCompromised',
            'trustedNotObsoleteCompromised',
            'trustedObsoleteCompromised',
            'notTrustedNotObsoleteNotCompromised',
            'notTrustedObsoleteNotCompromised',
        ];
        const sortedKeys = sortApiKeys({
            keys: fingerprints.map(generateFakeKey),
            obsoleteFingerprints: new Set([
                'trustedObsoleteNotCompromised',
                'trustedObsoleteCompromised',
                'notTrustedObsoleteNotCompromised',
                'notTrustedObsoleteCompromised',
            ]),
            compromisedFingerprints: new Set([
                'trustedObsoleteCompromised',
                'trustedNotObsoleteCompromised',
                'notTrustedObsoleteCompromised',
                'notTrustedNotObsoleteCompromised',
            ]),
            trustedFingerprints: new Set([
                'trustedObsoleteCompromised',
                'trustedNotObsoleteCompromised',
                'trustedObsoleteNotCompromised',
                'trustedNotObsoleteNotCompromised',
            ]),
        });
        expect(sortedKeys.map((key) => key.getFingerprint())).toEqual([
            'trustedNotObsoleteNotCompromised',
            'trustedObsoleteNotCompromised',
            'trustedNotObsoleteCompromised',
            'trustedObsoleteCompromised',
            'notTrustedNotObsoleteNotCompromised',
            'notTrustedObsoleteNotCompromised',
            'notTrustedNotObsoleteCompromised',
            'notTrustedObsoleteCompromised',
        ]);
    });
});

describe('sortPinnedKeys', () => {
    const generateFakeKey = (fingerprint: string) =>
        ({
            getFingerprint() {
                return fingerprint;
            },
        } as PublicKeyReference);
    it('sort keys as expected', () => {
        const fingerprints = [
            'cannotEncryptObsoleteNotCompromised',
            'canEncryptObsoleteCompromised',
            'cannotEncryptNotObsoleteNotCompromised',
            'canEncryptNotObsoleteCompromised',
            'cannotEncryptNotObsoleteCompromised',
            'cannotEncryptObsoleteCompromised',
            'canEncryptNotObsoleteNotCompromised',
            'canEncryptObsoleteNotCompromised',
        ];
        const sortedKeys = sortPinnedKeys({
            keys: fingerprints.map(generateFakeKey),
            obsoleteFingerprints: new Set([
                'canEncryptObsoleteNotCompromised',
                'canEncryptObsoleteCompromised',
                'cannotEncryptObsoleteNotCompromised',
                'cannotEncryptObsoleteCompromised',
            ]),
            compromisedFingerprints: new Set([
                'canEncryptObsoleteCompromised',
                'canEncryptNotObsoleteCompromised',
                'cannotEncryptObsoleteCompromised',
                'cannotEncryptNotObsoleteCompromised',
            ]),
            encryptionCapableFingerprints: new Set([
                'canEncryptObsoleteCompromised',
                'canEncryptNotObsoleteCompromised',
                'canEncryptObsoleteNotCompromised',
                'canEncryptNotObsoleteNotCompromised',
            ]),
        });
        expect(sortedKeys.map((key) => key.getFingerprint())).toEqual([
            'canEncryptNotObsoleteNotCompromised',
            'canEncryptObsoleteNotCompromised',
            'canEncryptNotObsoleteCompromised',
            'canEncryptObsoleteCompromised',
            'cannotEncryptNotObsoleteNotCompromised',
            'cannotEncryptObsoleteNotCompromised',
            'cannotEncryptNotObsoleteCompromised',
            'cannotEncryptObsoleteCompromised',
        ]);
    });
});
