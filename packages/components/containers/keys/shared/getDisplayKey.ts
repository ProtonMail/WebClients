import { describe } from 'proton-shared/lib/keys/keysAlgorithm';
import { KEY_FLAG } from 'proton-shared/lib/constants';
import { Address, Key } from 'proton-shared/lib/interfaces';
import { hasBit } from 'proton-shared/lib/helpers/bitset';

import { algorithmInfo } from 'pmcrypto';
import { KeyDisplay } from './interface';

interface Arguments {
    User: any;
    Address?: Address;
    fingerprint: string;
    isDecrypted: boolean;
    isLoading: boolean;
    Key: Key;
    algorithmInfo?: algorithmInfo;
}
export const getDisplayKey = ({
    User,
    Address,
    algorithmInfo,
    fingerprint,
    isDecrypted,
    isLoading,
    Key: { ID, Primary, Flags },
}: Arguments): KeyDisplay => {
    const { Status } = Address || {};
    const { isSubUser, isPrivate } = User;

    const isAddressDisabled = Status === 0;
    const isAddressKey = !!Address;
    const isPrimary = Primary === 1;

    // Flags undefined for user keys
    const canEncrypt = Flags === undefined ? true : hasBit(Flags, KEY_FLAG.ENCRYPT);
    const canSign = Flags === undefined ? true : hasBit(Flags, KEY_FLAG.VERIFY);

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
        algorithm: describe(algorithmInfo),
        status,
        permissions,
    };
};
