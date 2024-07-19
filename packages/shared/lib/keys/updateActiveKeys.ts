import type { ActiveAddressKeyPayload } from '../api/keys';
import { AddressActiveStatus, updateAddressActiveKeysRoute } from '../api/keys';
import type { Address, Api, DecryptedKey, KeyTransparencyVerify } from '../interfaces';
import { getActiveKeys, getNormalizedActiveKeys } from './getActiveKeys';
import { getInactiveKeys } from './getInactiveKeys';
import { getSignedKeyListWithDeferredPublish } from './signedKeyList';

/**
 * Checks if there is a mismatch between active keys reported by the server
 * and decrypted keys of the client.
 */
export const hasActiveKeysMismatch = (address: Address, decryptedKeys: DecryptedKey[]): Boolean => {
    if (!decryptedKeys.length || !address.SignedKeyList) {
        // If there are no decrypted keys or no skl, do not update.
        return false;
    }
    const activeKeysIDs = new Set(decryptedKeys.map(({ ID }) => ID));
    return address.Keys.some(({ Active, ID }) => Active && !activeKeysIDs.has(ID));
};

/**
 * Updates the active keys in the backend with the current active keys at the client.
 * Should be called if a mismatch of active keys between the server and the client has been detected.
 */
export const updateActiveKeys = async (
    api: Api,
    address: Address,
    decryptedKeys: DecryptedKey[],
    keyTransparencyVerify: KeyTransparencyVerify
) => {
    const [activeKeys, inactiveKeys] = await Promise.all([
        getActiveKeys(address, address.SignedKeyList, address.Keys, decryptedKeys),
        getInactiveKeys(address.Keys, decryptedKeys),
    ]);
    const normalizedActiveKeys = getNormalizedActiveKeys(address, activeKeys);
    const [signedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        normalizedActiveKeys,
        address,
        keyTransparencyVerify
    );
    const activeKeysPayload = normalizedActiveKeys.map<ActiveAddressKeyPayload>(({ ID }) => {
        return {
            AddressKeyID: ID,
            Active: AddressActiveStatus.ACTIVE,
        };
    });
    const inactiveKeysPayload = inactiveKeys.map<ActiveAddressKeyPayload>(({ Key }) => {
        return {
            AddressKeyID: Key.ID,
            Active: AddressActiveStatus.INACTIVE,
        };
    });
    await api(
        updateAddressActiveKeysRoute({
            AddressID: address.ID,
            Keys: activeKeysPayload.concat(inactiveKeysPayload),
            SignedKeyList: signedKeyList,
        })
    );
    await onSKLPublishSuccess();
};
