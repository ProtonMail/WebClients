import { algorithmInfo } from 'pmcrypto';

import { getFormattedAlgorithmName, getDefaultKeyFlags } from '@proton/shared/lib/keys';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { Address, Key, SignedKeyListItem, UserModel } from '@proton/shared/lib/interfaces';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';

import { KeyDisplay } from './interface';

interface Arguments {
    User: UserModel;
    Address?: Address;
    fingerprint: string;
    isDecrypted: boolean;
    isLoading: boolean;
    Key: Key;
    algorithmInfo?: algorithmInfo;
    signedKeyListMap: SimpleMap<SignedKeyListItem>;
}

export const getDisplayKey = ({
    User,
    Address,
    algorithmInfo,
    fingerprint,
    isDecrypted,
    isLoading,
    signedKeyListMap,
    Key,
}: Arguments): KeyDisplay => {
    const { isSubUser, isPrivate } = User;
    const signedKeyListItem = signedKeyListMap[fingerprint];

    const { ID, Flags, Primary } = Key;

    const flags = signedKeyListItem?.Flags ?? Flags ?? getDefaultKeyFlags();
    const primary = signedKeyListItem?.Primary ?? Primary ?? 0;

    const isAddressDisabled = Address?.Status === 0;
    const isAddressKey = !!Address;
    const isPrimary = primary === 1;

    // Flags undefined for user keys
    const canEncrypt = flags === undefined ? true : hasBit(flags, KEY_FLAG.FLAG_NOT_OBSOLETE);
    const canSign = flags === undefined ? true : hasBit(flags, KEY_FLAG.FLAG_NOT_COMPROMISED);

    const canEncryptAndSign = canEncrypt && canSign;
    const isObsolete = isDecrypted && !isAddressDisabled && !canEncrypt;
    const isCompromised = !canEncrypt && !canSign;

    const status = {
        isAddressDisabled,
        isPrimary,
        isDecrypted,
        isLoading,
        isCompromised,
        isObsolete,
    };

    const hasUserPermission = !isSubUser || isPrivate;
    const canModify = isAddressKey && hasUserPermission && !isPrimary;

    const permissions = {
        canReactivate: !isSubUser && !isDecrypted,
        canExportPublicKey: true,
        canExportPrivateKey: isDecrypted,
        canSetPrimary: canModify && !isAddressDisabled && isDecrypted && canEncryptAndSign,
        canSetObsolete: canModify && !isAddressDisabled && isDecrypted && !isObsolete && !isCompromised,
        canSetNotObsolete: canModify && isObsolete && !isCompromised,
        canSetCompromised: canModify && !isCompromised,
        canSetNotCompromised: canModify && isCompromised,
        canDelete: canModify,
    };

    return {
        ID,
        fingerprint,
        algorithmInfo,
        flags,
        primary,
        algorithm: getFormattedAlgorithmName(algorithmInfo),
        status,
        permissions,
    };
};
