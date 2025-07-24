import { type KeyMetadata } from '@proton/account/addressKeys/getKeyMetadata';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Address, Key, SignedKeyListItem, UserModel } from '@proton/shared/lib/interfaces';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { getDefaultKeyFlags, getFormattedAlgorithmNames } from '@proton/shared/lib/keys';

import getPermissions from './getPermissions';
import type { KeyDisplay, KeyStatus } from './interface';
import { KeyType } from './interface';

interface Arguments extends KeyMetadata<Key> {
    user: UserModel;
    address?: Address;
    isLoading: boolean;
    signedKeyListMap: SimpleMap<SignedKeyListItem | undefined>;
    /** whether a v6 primary key is present in the set of keys being parsed */
    existsPrimaryKeyV6: boolean;
}

export const getDisplayKey = ({
    user,
    address,
    algorithmInfos,
    fingerprint,
    version,
    creationDate,
    isDecrypted,
    isLoading,
    signedKeyListMap,
    existsPrimaryKeyV6,
    Key,
    isWeak,
    isE2EEForwardingKey,
    invalidKeyError,
}: Arguments): KeyDisplay => {
    const { isPrivate, isSelf } = user;
    const signedKeyListItem = signedKeyListMap[Key.ID];

    const { ID, Flags, Primary, AddressForwardingID, GroupMemberID } = Key;

    const flags = signedKeyListItem?.Flags ?? Flags ?? getDefaultKeyFlags(address);
    const primary = signedKeyListItem?.Primary ?? Primary;

    const isAddressKey = !!address;
    const isAddressDisabled = address?.Status === 0;

    const isPrimary = primary === 1;
    const isPrimaryCompatibility = existsPrimaryKeyV6 && isPrimary && version !== 6;

    // Flags undefined for user keys
    const canEncrypt = flags === undefined ? true : hasBit(flags, KEY_FLAG.FLAG_NOT_OBSOLETE);
    const canSign = flags === undefined ? true : hasBit(flags, KEY_FLAG.FLAG_NOT_COMPROMISED);

    const canEncryptAndSign = canEncrypt && canSign;
    const isObsolete = isDecrypted && !isAddressDisabled && !canEncrypt;
    const isCompromised = !canEncrypt && !canSign;
    const isForwarding = isE2EEForwardingKey;

    const status: KeyStatus = {
        isAddressDisabled,
        isPrimary,
        isPrimaryCompatibility,
        isDecrypted,
        isLoading,
        isCompromised,
        isObsolete,
        isWeak,
        isForwarding,
    };

    const hasUserPermission = isPrivate;
    const canModify = isAddressKey && hasUserPermission && !isPrimary;
    const canDeleteForwarding = (isPrivate || !isSelf) && (AddressForwardingID === null || GroupMemberID === null);

    return {
        ID,
        creationDate,
        fingerprint,
        algorithmInfos,
        type: isAddressKey ? KeyType.Address : KeyType.User,
        flags,
        primary,
        version,
        algorithm: getFormattedAlgorithmNames(algorithmInfos, version),
        status,
        invalidKeyError,
        permissions: getPermissions({
            ...status,
            canModify,
            canEncryptAndSign,
            isAddressKey,
            hasUserPermission,
            canDeleteForwarding,
        }),
    };
};
