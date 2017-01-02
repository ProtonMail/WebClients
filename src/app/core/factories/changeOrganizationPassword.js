angular.module('proton.core')
.factory('changeOrganizationPassword', (gettextCatalog, Organization, passwords, pmcw) => {
    return ({ newPassword, organizationKey, creds }) => {
        const keySalt = passwords.generateKeySalt();
        return passwords.computeKeyPassword(newPassword, keySalt)
        .then((keyPassword) => pmcw.encryptPrivateKey(organizationKey, keyPassword))
        .then((PrivateKey) => Organization.updateBackupKeys({ PrivateKey, KeySalt: keySalt }, creds))
        .then((result) => {
            if (result.data && result.data.Code === 1000) {
                return result.data;
            } else if (result.data && result.data.Error) {
                return Promise.reject({ message: result.data.Error });
            }
            return Promise.reject({ message: gettextCatalog.getString('Error updating organization key recovery password', null, 'Error') });
        }, () => {
            return Promise.reject({ message: gettextCatalog.getString('Error updating organization key recovery password', null, 'Error') });
        });
    };
});
