import { encryptPrivateKey } from 'pmcrypto';
import { computeKeyPassword, generateKeySalt } from 'pm-srp';

/* @ngInject */
function changeOrganizationPassword(gettextCatalog, organizationApi) {
    return ({ newPassword, organizationKey, creds }) => {
        const KeySalt = generateKeySalt();
        return computeKeyPassword(newPassword, KeySalt)
            .then((keyPassword) => encryptPrivateKey(organizationKey, keyPassword))
            .then((PrivateKey) => organizationApi.updateBackupKeys(creds, { PrivateKey, KeySalt }))
            .then(({ data = {} } = {}) => data);
    };
}
export default changeOrganizationPassword;
