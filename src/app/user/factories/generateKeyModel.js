import { decryptPrivateKey, generateKey } from 'pmcrypto';

import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS, KEY_FLAGS } from '../../constants';
import { addGetKeys } from '../../../helpers/key';
import { isRSA, isECC } from '../../../helpers/keyAlgorithm';

/* @ngInject */
function generateKeyModel(
    Key,
    setupKeys,
    authentication,
    confirmModal,
    gettextCatalog,
    addressesModel,
    keysModel,
    translator
) {
    const STATE = {
        QUEUED: 0,
        GENERATING: 1,
        DONE: 2,
        SAVED: 3,
        ERROR: 4
    };

    const I18N = translator(() => ({
        TITLE: gettextCatalog.getString('Similar Key Already Active!', null, 'Title'),
        WARNING: gettextCatalog.getString(
            `A key with the same encryption algorithm is already active for this address.
Generating another key will cause slower account loading and deletion of this key can cause issues.
If you are generating a new key because your old key is compromised, please mark that key as compromised.
Are you sure you want to continue?`,
            null,
            'Message'
        )
    }));

    const onSuccess = (address, key) => {
        address.state = STATE.SAVED;
        address.Keys = address.Keys || [];
        address.Keys.push(key);

        return address;
    };

    const getStates = () => STATE;

    /**
     * Extract algorithms used for an address (keys)
     * @param {Object} address
     * @return {Promise<Array>}
     */
    const getAlgorithms = async (address) => {
        const { Keys = [] } = addressesModel.getByID(address.ID, authentication.user, true) || {};

        return (await addGetKeys(Keys, 'PublicKey')).reduce((acc, { keys, Flags }) => {
            if (Flags !== KEY_FLAGS.DISABLED) {
                acc.push(keys[0].getAlgorithmInfo());
            }
            return acc;
        }, []);
    };

    /**
     * Check if an active key already use the same algorithm
     * @param {Array} algorithms [{algorithm: "eddsa", curve: "ed25519"}, {algorithm: "rsa_encrypt_sign", bits: 2048}, {algorithm: "rsa_encrypt_sign", bits: 4096}]
     * @param {Object} encryptionConfig
     * @return {Boolean}
     */
    const alreadyUsed = (algorithms = [], encryptionConfig) => {
        return algorithms.some(({ algorithm, curve, bits }) => {
            if (isECC(algorithm)) {
                return curve === encryptionConfig.curve;
            }

            if (isRSA(algorithm)) {
                return bits === encryptionConfig.numBits;
            }

            return false;
        });
    };

    /**
     * Warns the user that such a key already exists and discourages the user from generating a new key.
     * @return {Promise}
     */
    const warn = () =>
        new Promise((resolve, reject) => {
            confirmModal.activate({
                params: {
                    icon: 'fa fa-exclamation-triangle',
                    isDanger: true,
                    title: I18N.TITLE,
                    message: I18N.WARNING,
                    class: 'very-important',
                    confirm() {
                        confirmModal.deactivate();
                        resolve();
                    },
                    cancel() {
                        confirmModal.deactivate();
                        reject();
                    }
                }
            });
        });

    /**
     * Triggers the generate key process
     * @param {String} encryptionConfigName
     * @param {String} passphrase
     * @param {String} organizationKey
     * @param {Object} memberMap
     * @param {Object} address
     * @param {Boolean} primary
     * @returns {Promise}
     */
    const generate = async ({
        encryptionConfigName = DEFAULT_ENCRYPTION_CONFIG,
        passphrase,
        organizationKey,
        memberMap = {},
        address,
        primary = true
    }) => {
        const algorithms = await getAlgorithms(address);
        const encryptionConfig = ENCRYPTION_CONFIGS[encryptionConfigName];

        if (alreadyUsed(algorithms, encryptionConfig)) {
            // An active key with the requested amount of bits already exists: discourage the user from generating a new key
            try {
                await warn();
            } catch (canceled) {
                return null;
            }
        }

        try {
            address.state = STATE.GENERATING;

            const { privateKeyArmored: PrivateKey } = await generateKey({
                userIds: [{ name: address.Email, email: address.Email }],
                passphrase,
                ...encryptionConfig
            });

            address.state = STATE.DONE;

            const member = memberMap[address.ID] || {};

            if (member.ID) {
                const keys = await setupKeys.generateAddresses([address], 'temp', encryptionConfigName);
                const key = await setupKeys.memberKey('temp', keys[0], member, organizationKey);
                return onSuccess(address, key);
            }

            const { data } = await Key.create({
                AddressID: address.ID,
                PrivateKey,
                Primary: primary,
                SignedKeyList: await keysModel.signedKeyList(address.ID, {
                    mode: 'create',
                    decryptedPrivateKey: await decryptPrivateKey(PrivateKey, passphrase),
                    encryptedPrivateKey: PrivateKey
                })
            });

            return onSuccess(address, data.Key);
        } catch (err) {
            address.state = STATE.ERROR;
            throw err;
        }
    };

    return { generate, getStates };
}

export default generateKeyModel;
