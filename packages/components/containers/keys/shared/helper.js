import { describe } from 'proton-shared/lib/keys/keysAlgorithm';
import { KEY_FLAG } from 'proton-shared/lib/constants';

const { SIGNED, ENCRYPTED_AND_SIGNED, CLEAR_TEXT } = KEY_FLAG;

/**
 * Convert a key for display in the view.
 * @param {Object} User - The user
 * @param {Object} [Address] - The address the key belongs to
 * @param {Object} privateKey - Parsed pgp key
 * @param {Object} Key - Key result from the API
 * @returns {Object}
 */
export const convertKey = ({ User, Address, privateKey, Key: { ID, Primary, Flags } }) => {
    const algorithmInfo = privateKey.getAlgorithmInfo();
    const fingerprint = privateKey.getFingerprint();
    const isDecrypted = privateKey.isDecrypted();

    const { Status } = Address || {};
    const { isSubUser, isPrivate } = User;

    const isAddressDisabled = Status === 0;
    const isAddressKey = !!Address;
    const isPrimary = Primary === 1;
    const isEncryptingAndSigning = Flags === ENCRYPTED_AND_SIGNED;
    const isObsolete = isDecrypted && !isAddressDisabled && Flags === SIGNED;
    const isCompromised = Flags === CLEAR_TEXT;

    const status = {
        isAddressDisabled,
        isPrimary,
        isDecrypted,
        isCompromised,
        isObsolete
    };

    const hasUserPermission = !isSubUser || isPrivate;
    const canModify = isAddressKey && hasUserPermission && !isPrimary;

    const permissions = {
        canReactivate: !isSubUser && !isDecrypted,
        canExportPublicKey: true,
        canExportPrivateKey: isDecrypted,
        canMakePrimary: canModify && !isAddressDisabled && isDecrypted && isEncryptingAndSigning,
        canMarkObsolete: canModify && !isAddressDisabled && isDecrypted && !isObsolete && !isCompromised,
        canMarkNotObsolete: canModify && isObsolete,
        canMarkCompromised: canModify && !isCompromised,
        canMarkNotCompromised: canModify && isCompromised,
        canDelete: canModify
    };

    return {
        ID,
        fingerprint,
        algorithm: describe(algorithmInfo),
        status,
        permissions
    };
};

/**
 * @param {Array} keys
 * @return {Array}
 */
const getKeysToReactivate = (keys = []) => {
    return keys.filter(({ privateKey }) => !privateKey.isDecrypted());
};

/**
 * @param {Array} Addresses
 * @param {Object} addressesKeysMap
 * @param {Object} User
 * @param {Array} userKeysList
 * @return {Array}
 */
export const getAllKeysToReactivate = ({ Addresses = [], addressesKeysMap = {}, User, userKeysList = [] }) => {
    const allAddressesKeys = Addresses.map((Address) => {
        const { ID } = Address;
        const addressKeysList = addressesKeysMap[ID];
        const addressKeysToReactivate = getKeysToReactivate(addressKeysList);
        if (!addressKeysToReactivate.length) {
            return;
        }
        return {
            Address,
            keys: addressKeysList,
            inactiveKeys: addressKeysToReactivate
        };
    });

    const userKeysToReactivate = getKeysToReactivate(userKeysList);

    return [
        ...allAddressesKeys,
        userKeysToReactivate.length && {
            User,
            keys: userKeysList,
            inactiveKeys: userKeysToReactivate
        }
    ].filter(Boolean);
};
