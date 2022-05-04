import { CryptoProxy, PublicKeyReference } from '@proton/crypto';
import { ValidPublicKey, ExpiredPublicKey, SignOnlyPublicKey } from './keys.data';
import { getContactPublicKeyModel, sortApiKeys, sortPinnedKeys } from '../../lib/keys/publicKeys';

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
