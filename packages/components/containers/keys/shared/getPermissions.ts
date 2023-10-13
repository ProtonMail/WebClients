import { KeyStatus } from './interface';

interface Arguments extends KeyStatus {
    canModify: boolean;
    canEncryptAndSign: boolean;
    isAddressKey: boolean;
    hasUserPermission: boolean;
    canDeleteForwarding: boolean;
}

const getPermissions = ({
    canModify,
    isDecrypted,
    isAddressDisabled,
    isCompromised,
    isObsolete,
    canEncryptAndSign,
    isAddressKey,
    isPrimary,
    hasUserPermission,
    isForwarding,
    canDeleteForwarding,
}: Arguments) => {
    if (isForwarding) {
        return {
            canExportPublicKey: false,
            canExportPrivateKey: false,
            canSetPrimary: false,
            canSetObsolete: false,
            canSetNotObsolete: false,
            canSetCompromised: false,
            canSetNotCompromised: false,
            canDelete: canDeleteForwarding,
        };
    }
    return {
        canExportPublicKey: true,
        canExportPrivateKey: isDecrypted,
        canSetPrimary: canModify && !isAddressDisabled && isDecrypted && canEncryptAndSign,
        canSetObsolete: canModify && !isAddressDisabled && isDecrypted && !isObsolete && !isCompromised,
        canSetNotObsolete: canModify && isObsolete && !isCompromised,
        canSetCompromised: canModify && !isCompromised,
        canSetNotCompromised: canModify && isCompromised,
        canDelete: isAddressKey && hasUserPermission && !isPrimary,
    };
};

export default getPermissions;
