/* @ngInject */
function changeOrganizationPassword(gettextCatalog, organizationApi, passwords, pmcw) {
    return ({ newPassword, organizationKey, creds }) => {
        const KeySalt = passwords.generateKeySalt();
        return passwords
            .computeKeyPassword(newPassword, KeySalt)
            .then((keyPassword) => pmcw.encryptPrivateKey(organizationKey, keyPassword))
            .then((PrivateKey) => organizationApi.updateBackupKeys({ PrivateKey, KeySalt }, creds))
            .then(({ data = {} } = {}) => data);
    };
}
export default changeOrganizationPassword;
