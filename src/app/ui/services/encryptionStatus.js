import { SENDPREF_STATUS } from '../../constants';

/* @ngInject */
function encryptionStatus(gettextCatalog) {
    /**
     * This generates a bitmap of SENDPREF_STATUS. For each value in SENDPREF_STATUS a bit will be set.
     * @param emailInfo
     * @return {number}
     */
    const getStatusCode = (emailInfo) => {
        return (
            emailInfo.loadCryptInfo * SENDPREF_STATUS.LOADING_CRYPT_INFO +
            emailInfo.encrypt * SENDPREF_STATUS.ENCRYPTION_ENABLED +
            emailInfo.sign * SENDPREF_STATUS.SIGNING_ENABLED +
            (emailInfo.isPgp && emailInfo.isPgpMime) * SENDPREF_STATUS.PGP_MIME +
            (emailInfo.isPgp && !emailInfo.isPgpMime) * SENDPREF_STATUS.PGP_INLINE +
            emailInfo.isEO * SENDPREF_STATUS.PM_EO +
            (emailInfo.isPinned && !emailInfo.isPgp) * SENDPREF_STATUS.PINNING_ENABLED
        );
    };
    const I18N = {
        LOADING_CRYPT_INFO: gettextCatalog.getString('Loading encryption info...'),
        PGP_SIGN: gettextCatalog.getString('PGP-signed'),
        PGP_ENCRYPT_SIGN: gettextCatalog.getString('PGP-encrypted'),
        PINNED_ENCRYPT_SIGN: gettextCatalog.getString('End-to-end encrypted to verified recipient'),
        PM_ENCRYPT_SIGN: gettextCatalog.getString('End-to-end encrypted')
    };
    const getTooltip = (emailInfo) => {
        // turn into a bitmask value :-)
        switch (getStatusCode(emailInfo)) {
            case SENDPREF_STATUS.PGP_MIME | !SENDPREF_STATUS.ENCRYPTION_ENABLED | SENDPREF_STATUS.SIGNING_ENABLED:
                return I18N.PGP_SIGN;
            case SENDPREF_STATUS.PGP_MIME | SENDPREF_STATUS.ENCRYPTION_ENABLED | SENDPREF_STATUS.SIGNING_ENABLED:
                return I18N.PGP_ENCRYPT_SIGN;
            case SENDPREF_STATUS.PM_EO | SENDPREF_STATUS.ENCRYPTION_ENABLED:
            case SENDPREF_STATUS.PM_EO | SENDPREF_STATUS.ENCRYPTION_ENABLED | SENDPREF_STATUS.PINNING_ENABLED:
                return I18N.PM_ENCRYPT_SIGN;
            case SENDPREF_STATUS.PGP_INLINE | !SENDPREF_STATUS.ENCRYPTION_ENABLED | SENDPREF_STATUS.SIGNING_ENABLED:
                return I18N.PGP_SIGN;
            case SENDPREF_STATUS.PGP_INLINE | SENDPREF_STATUS.ENCRYPTION_ENABLED | SENDPREF_STATUS.SIGNING_ENABLED:
                return I18N.PGP_ENCRYPT_SIGN;
            case SENDPREF_STATUS.PINNING_ENABLED | SENDPREF_STATUS.ENCRYPTION_ENABLED | SENDPREF_STATUS.SIGNING_ENABLED: // Internal Pm pinned
                return I18N.PINNED_ENCRYPT_SIGN;
            case SENDPREF_STATUS.ENCRYPTION_ENABLED | SENDPREF_STATUS.SIGNING_ENABLED: // Internal Pm
                return I18N.PM_ENCRYPT_SIGN;
            default:
                return I18N.LOADING_CRYPT_INFO;
        }
    };

    return { getTooltip };
}
export default encryptionStatus;
