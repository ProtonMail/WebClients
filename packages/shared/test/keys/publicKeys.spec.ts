import type { PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';

import { API_KEY_SOURCE, RECIPIENT_TYPES } from '../../lib/constants';
import { getContactPublicKeyModel, sortApiKeys, sortPinnedKeys } from '../../lib/keys/publicKeys';
import { ExpiredPublicKey, SignOnlyPublicKey, ValidPublicKey } from './keys.data';

describe('get contact public key model', () => {
    const publicKeyConfig = {
        emailAddress: '',
        apiKeysConfig: {
            Keys: [],
            publicKeys: [],
            SignedKeyList: null,
        },
        preferV6Keys: false,
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
                publicKeys: [{ publicKey, armoredKey: '', flags: 1, primary: 1, source: API_KEY_SOURCE.WKD }],
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
                publicKeys: [{ publicKey, armoredKey: '', flags: 1, primary: 1, source: API_KEY_SOURCE.WKD }],
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
                publicKeys: [{ publicKey, armoredKey: '', flags: 1, primary: 1, source: API_KEY_SOURCE.WKD }],
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
                publicKeys: [{ publicKey, armoredKey: '', flags: 1, primary: 1, source: API_KEY_SOURCE.PROTON }],
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
    const generateFakeKey = (fingerprint: string, version: 4 | 6 = 4) =>
        ({
            getVersion() {
                return version;
            },
            getFingerprint() {
                return fingerprint;
            },
        }) as PublicKeyReference;
    it('sort keys as expected - without v6 keys', () => {
        const fingerprintsV4 = [
            'trustedObsoleteNotCompromised',
            'notTrustedObsoleteCompromised',
            'trustedNotObsoleteNotCompromised',
            'notTrustedNotObsoleteCompromised',
            'trustedNotObsoleteCompromised',
            'trustedObsoleteCompromised',
            'notTrustedNotObsoleteNotCompromised',
            'notTrustedObsoleteNotCompromised',
        ];

        const commonOptions = {
            keys: fingerprintsV4.map((fp) => generateFakeKey(fp)),
            // this is expected to always be populated; it's empty here to test the other ordering conditions
            primaryKeyFingerprints: new Set([]),
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
        };
        const sortedKeysWithV4Preferred = sortApiKeys({
            ...commonOptions,
            preferV6Keys: false,
        });
        const sortedKeysWithV6Preferred = sortApiKeys({
            ...commonOptions,
            preferV6Keys: true,
        });
        expect(sortedKeysWithV4Preferred).toEqual(sortedKeysWithV6Preferred);
        expect(sortedKeysWithV4Preferred.map((key) => key.getFingerprint())).toEqual([
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

    it('sort keys as expected - with v6 keys', () => {
        const fingerprintsV4 = [
            'trustedObsoleteNotCompromised',
            'notTrustedObsoleteCompromised',
            'trustedNotObsoleteNotCompromised',
            'notTrustedNotObsoleteCompromised',
            'trustedNotObsoleteCompromised',
            'trustedObsoleteCompromised',
            'notTrustedNotObsoleteNotCompromisedPrimary',
            'notTrustedObsoleteNotCompromised',
        ];
        const fingerprintsV6 = [
            'notTrustedNotObsoleteNotCompromisedPrimaryV6',
            'notTrustedNotObsoleteNotCompromisedV6',
        ];
        const commonOptions = {
            keys: [
                ...fingerprintsV4.map((fp) => generateFakeKey(fp)),
                ...fingerprintsV6.map((fp) => generateFakeKey(fp, 6)),
            ],
            primaryKeyFingerprints: new Set([
                'notTrustedNotObsoleteNotCompromisedPrimary',
                'notTrustedNotObsoleteNotCompromisedPrimaryV6',
            ]),
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
        };
        const sortedKeysWithV4Preferred = sortApiKeys({
            ...commonOptions,
            preferV6Keys: false,
        });
        const sortedKeysWithV6Preferred = sortApiKeys({
            ...commonOptions,
            preferV6Keys: true,
        });
        expect(sortedKeysWithV4Preferred.map((key) => key.getFingerprint())).toEqual([
            'trustedNotObsoleteNotCompromised',
            'trustedObsoleteNotCompromised',
            'trustedNotObsoleteCompromised',
            'trustedObsoleteCompromised',
            'notTrustedNotObsoleteNotCompromisedPrimary',
            'notTrustedNotObsoleteNotCompromisedPrimaryV6',
            'notTrustedNotObsoleteNotCompromisedV6',
            'notTrustedObsoleteNotCompromised',
            'notTrustedNotObsoleteCompromised',
            'notTrustedObsoleteCompromised',
        ]);
        expect(sortedKeysWithV6Preferred.map((key) => key.getFingerprint())).toEqual([
            'trustedNotObsoleteNotCompromised',
            'trustedObsoleteNotCompromised',
            'trustedNotObsoleteCompromised',
            'trustedObsoleteCompromised',
            'notTrustedNotObsoleteNotCompromisedPrimaryV6',
            'notTrustedNotObsoleteNotCompromisedPrimary',
            'notTrustedNotObsoleteNotCompromisedV6',
            'notTrustedObsoleteNotCompromised',
            'notTrustedNotObsoleteCompromised',
            'notTrustedObsoleteCompromised',
        ]);
    });
});

describe('sortPinnedKeys', () => {
    const generateFakeKey = (fingerprint: string, version: 4 | 6 = 4) =>
        ({
            getVersion() {
                return version;
            },
            getFingerprint() {
                return fingerprint;
            },
        }) as PublicKeyReference;
    it('sort keys as expected - without v6 keys', () => {
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
        const commonOptions = {
            keys: fingerprints.map((fp) => generateFakeKey(fp)),
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
        };

        const sortedKeysWithV4Preferred = sortPinnedKeys({
            ...commonOptions,
            preferV6Keys: false,
        });
        const sortedKeysWithV6Preferred = sortPinnedKeys({
            ...commonOptions,
            preferV6Keys: true,
        });
        expect(sortedKeysWithV4Preferred).toEqual(sortedKeysWithV6Preferred);

        expect(sortedKeysWithV4Preferred.map((key) => key.getFingerprint())).toEqual([
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

    it('sort keys as expected - with v6 keys', () => {
        const fingerprintsV4 = [
            'cannotEncryptObsoleteNotCompromised',
            'canEncryptObsoleteCompromised',
            'cannotEncryptNotObsoleteNotCompromised',
            'canEncryptNotObsoleteCompromised',
            'cannotEncryptNotObsoleteCompromised',
            'cannotEncryptObsoleteCompromised',
            'canEncryptNotObsoleteNotCompromised',
            'canEncryptObsoleteNotCompromised',
        ];
        const fingerprintsV6 = ['canEncryptNotObsoleteNotCompromisedV6'];
        const commonOptions = {
            keys: [
                ...fingerprintsV4.map((fp) => generateFakeKey(fp)),
                ...fingerprintsV6.map((fp) => generateFakeKey(fp, 6)),
            ],
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
                'canEncryptNotObsoleteNotCompromisedV6',
            ]),
        };

        const sortedKeysWithV4Preferred = sortPinnedKeys({
            ...commonOptions,
            preferV6Keys: false,
        });
        const sortedKeysWithV6Preferred = sortPinnedKeys({
            ...commonOptions,
            preferV6Keys: true,
        });

        expect(sortedKeysWithV4Preferred.map((key) => key.getFingerprint())).toEqual([
            'canEncryptNotObsoleteNotCompromised',
            'canEncryptNotObsoleteNotCompromisedV6',
            'canEncryptObsoleteNotCompromised',
            'canEncryptNotObsoleteCompromised',
            'canEncryptObsoleteCompromised',
            'cannotEncryptNotObsoleteNotCompromised',
            'cannotEncryptObsoleteNotCompromised',
            'cannotEncryptNotObsoleteCompromised',
            'cannotEncryptObsoleteCompromised',
        ]);
        expect(sortedKeysWithV6Preferred.map((key) => key.getFingerprint())).toEqual([
            'canEncryptNotObsoleteNotCompromisedV6',
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
