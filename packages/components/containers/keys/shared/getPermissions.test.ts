import getPermissions from './getPermissions';

describe('getPermissions', () => {
    describe('when isForwarding is true', () => {
        it('should return the correct permissions', () => {
            const permissions = getPermissions({
                canModify: false,
                isDecrypted: false,
                isAddressDisabled: false,
                isCompromised: false,
                isObsolete: false,
                canEncryptAndSign: false,
                isAddressKey: false,
                isPrimary: false,
                isPrimaryFallback: false,
                hasUserPermission: false,
                isForwarding: true,
                canDeleteForwarding: true,
                isLoading: false,
                isWeak: false,
            });

            expect(permissions).toEqual({
                canExportPublicKey: false,
                canExportPrivateKey: false,
                canSetPrimary: false,
                canSetObsolete: false,
                canSetNotObsolete: false,
                canSetCompromised: false,
                canSetNotCompromised: false,
                canDelete: true,
            });
        });
    });

    describe('when isForwarding is false', () => {
        it('should return the correct permissions', () => {
            const permissions = getPermissions({
                canModify: true,
                isDecrypted: true,
                isAddressDisabled: false,
                isCompromised: false,
                isObsolete: false,
                canEncryptAndSign: true,
                isAddressKey: true,
                isPrimary: false,
                isPrimaryFallback: false,
                hasUserPermission: true,
                isForwarding: false,
                canDeleteForwarding: true,
                isLoading: false,
                isWeak: false,
            });

            expect(permissions).toEqual({
                canExportPublicKey: true,
                canExportPrivateKey: true,
                canSetPrimary: true,
                canSetObsolete: true,
                canSetNotObsolete: false,
                canSetCompromised: true,
                canSetNotCompromised: false,
                canDelete: true,
            });
        });
    });
});
