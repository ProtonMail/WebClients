import { getKeys } from 'pmcrypto';
import { ValidPublicKey, ExpiredPublicKey, SignOnlyPublicKey } from './keys.data';
import { getContactPublicKeyModel } from '../../lib/keys/publicKeys';

describe('get contact public key model', () => {
    const publicKeyConfig = {
        emailAddress: '',
        apiKeysConfig: {
            Keys: [],
            publicKeys: [],
        },
    };

    it('should mark valid key as capable of encryption', async () => {
        const [publicKey] = await getKeys(ValidPublicKey);
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
        const [publicKey] = await getKeys(ExpiredPublicKey);
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
        const [publicKey] = await getKeys(SignOnlyPublicKey);
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
