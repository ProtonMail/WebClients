import { setKeyPrimaryRoute } from '@proton/shared/lib/api/keys';
import { Address, FixMultiplePrimaryKeys } from '@proton/shared/lib/interfaces';
import { getActiveKeys, getNormalizedActiveKeys } from '@proton/shared/lib/keys/getActiveKeys';
import { getSignedKeyList } from '@proton/shared/lib/keys/signedKeyList';

import { useApi, useGetAddressKeys } from '../../hooks';

export const useFixMultiplePrimaryKeys = (): FixMultiplePrimaryKeys => {
    const api = useApi();
    const getAddressKeys = useGetAddressKeys();

    const hasMultiplePrimaryKeys = (address: Address): Boolean => {
        let hasSeenPrimary = false;
        for (const addressKey of address.Keys) {
            if (addressKey.Primary == 1) {
                if (hasSeenPrimary) {
                    return true;
                }
                hasSeenPrimary = true;
            }
        }
        return false;
    };

    const normalizePrimaryKey = async (address: Address): Promise<void> => {
        const addressKeys = await getAddressKeys(address.ID);
        const activeKeys = getNormalizedActiveKeys(
            address,
            await getActiveKeys(address, address.SignedKeyList, address.Keys, addressKeys)
        );
        const primaryID = activeKeys.find((key) => key.primary === 1)?.ID;
        const signedKeyList = await getSignedKeyList(activeKeys, address, async () => {});
        if (primaryID) {
            await api(setKeyPrimaryRoute({ ID: primaryID, SignedKeyList: signedKeyList }));
        }
    };

    const fixMultiplePrimaryKeys: FixMultiplePrimaryKeys = async (address: Address): Promise<void> => {
        if (!hasMultiplePrimaryKeys(address) || !address.SignedKeyList?.Data) {
            return;
        }
        await normalizePrimaryKey(address);
    };

    return fixMultiplePrimaryKeys;
};
