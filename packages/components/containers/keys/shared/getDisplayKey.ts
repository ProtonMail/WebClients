import { describe } from 'proton-shared/lib/keys/keysAlgorithm';
import { KEY_FLAG } from 'proton-shared/lib/constants';
import { Address } from 'proton-shared/lib/interfaces';
import { Key } from 'proton-shared/lib/interfaces';
import { algorithmInfo } from 'pmcrypto';
import { KeyDisplay } from './interface';

const { SIGNED, ENCRYPTED_AND_SIGNED, CLEAR_TEXT } = KEY_FLAG;

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
    const isEncryptingAndSigning = Flags === ENCRYPTED_AND_SIGNED;
    const isObsolete = isDecrypted && !isAddressDisabled && Flags === SIGNED;
    const isCompromised = Flags === CLEAR_TEXT;

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
        canSetPrimary: canModify && !isAddressDisabled && isDecrypted && isEncryptingAndSigning,
        canSetObsolete: canModify && !isAddressDisabled && isDecrypted && !isObsolete && !isCompromised,
        canSetNotObsolete: canModify && isObsolete,
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
