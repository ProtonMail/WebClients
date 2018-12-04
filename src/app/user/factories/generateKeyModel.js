import { KEY_FLAGS } from '../../constants';
import { addGetKeys } from '../../../helpers/key';

/* @ngInject */
function generateKeyModel(Key, pmcw, setupKeys, authentication, confirmModal, gettextCatalog, addressesModel) {
    const STATE = {
        QUEUED: 0,
        GENERATING: 1,
        DONE: 2,
        SAVED: 3,
        ERROR: 4
    };

    const I18N = {
        TITLE: gettextCatalog.getString('Similar Key Already Active!', null, 'Title'),
        warningMessage(bits) {
            return gettextCatalog.getString(
                `An RSA key with bit size {{ bits }} is already active for this address.
Generating another key will cause slower account loading and deletion of this key can cause issues.
If you are generating a new key because your old key is compromised, please mark that key as compromised.
Are you sure you want to continue?`,
                { bits },
                'Message'
            );
        }
    };

    const onSuccess = (address, key) => {
        address.state = STATE.SAVED;
        address.Keys = address.Keys || [];
        address.Keys.push(key);

        return address;
    };

    const getStates = () => STATE;

    /**
     * Warns the user that such a key already exists and discourages the user from generating a new key.
     * @param {Integer} numBits
     */
    const warn = (numBits) =>
        new Promise((resolve, reject) => {
            confirmModal.activate({
                params: {
                    icon: 'fa fa-exclamation-triangle',
                    isDanger: true,
                    title: I18N.TITLE,
                    message: I18N.warningMessage(numBits),
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
     * @param {Integer} numBits
     * @param {String} passphrase
     * @param {String} organizationKey
     * @param {Object} memberMap
     * @param {Object} address
     * @param {Boolean} primary
     * @returns {Promise}
     */
    const generate = async ({ numBits, passphrase, organizationKey, memberMap = {}, address, primary = true }) => {
        const { Keys = [] } = addressesModel.getByID(address.ID, authentication.user, true) || {};
        const algorithms = (await addGetKeys(Keys, 'PublicKey')).reduce((acc, { keys, Flags }) => {
            if (Flags !== KEY_FLAGS.DISABLED) {
                acc.push(keys[0].getAlgorithmInfo());
            }
            return acc;
        }, []);
        if (algorithms.find(({ bits }) => bits === numBits)) {
            // An active key with the requested amount of bits already exists: discourage the user from generating a new key
            try {
                await warn(numBits);
            } catch (canceled) {
                return null;
            }
        }
        try {
            address.state = STATE.GENERATING;
            const { privateKeyArmored: PrivateKey } = await pmcw.generateKey({
                userIds: [{ name: address.Email, email: address.Email }],
                passphrase,
                numBits
            });

            address.state = STATE.DONE;

            const member = memberMap[address.ID] || {};
            if (member.ID) {
                const keys = await setupKeys.generateAddresses([address], 'temp', numBits);
                const key = await setupKeys.memberKey('temp', keys[0], member, organizationKey);
                return onSuccess(address, key);
            }

            const { data } = await Key.create({ AddressID: address.ID, PrivateKey, Primary: primary });
            return onSuccess(address, data.Key);
        } catch (err) {
            address.state = STATE.ERROR;
            throw err;
        }
    };

    return { generate, getStates };
}
export default generateKeyModel;
