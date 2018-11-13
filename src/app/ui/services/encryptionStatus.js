import { SENDPREF_STATUS } from '../../constants';

const {
    LOADING_CRYPT_INFO,
    PGP_MIME,
    ENCRYPTION_ENABLED,
    SIGNING_ENABLED,
    PINNING_ENABLED,
    PGP_INLINE,
    PM_EO
} = SENDPREF_STATUS;

/* @ngInject */
function encryptionStatus(gettextCatalog) {
    /**
     * This generates a bitmap of SENDPREF_STATUS. For each value in SENDPREF_STATUS a bit will be set.
     * @param emailInfo
     * @return {number}
     */
    const getStatusCode = ({
        loadCryptInfo = false,
        encrypt = false,
        sign = false,
        isPgpMime = false,
        isEO = false,
        isPgp = false,
        isPinned = false
    }) => {
        return (
            loadCryptInfo * LOADING_CRYPT_INFO +
            encrypt * ENCRYPTION_ENABLED +
            sign * SIGNING_ENABLED +
            (isPgp && isPgpMime) * PGP_MIME +
            (isPgp && !isPgpMime) * PGP_INLINE +
            isEO * PM_EO +
            (isPinned && !isPgp) * PINNING_ENABLED
        );
    };

    const I18N = {
        LOADING_CRYPT_INFO: gettextCatalog.getString('Loading encryption info...', null, 'Info'),
        PGP_SIGN: gettextCatalog.getString('PGP-signed', null, 'Info'),
        PGP_ENCRYPT_SIGN: gettextCatalog.getString('PGP-encrypted', null, 'Info'),
        PINNED_ENCRYPT_SIGN: gettextCatalog.getString('End-to-end encrypted to verified recipient', null, 'Info'),
        PM_ENCRYPT_SIGN: gettextCatalog.getString('End-to-end encrypted', null, 'Info')
    };

    const getTooltip = (emailInfo = {}) => {
        // turn into a bitmask value :-)
        switch (getStatusCode(emailInfo)) {
            case PGP_MIME | !ENCRYPTION_ENABLED | SIGNING_ENABLED:
                return I18N.PGP_SIGN;
            case PGP_MIME | ENCRYPTION_ENABLED | SIGNING_ENABLED:
                return I18N.PGP_ENCRYPT_SIGN;
            case PM_EO | ENCRYPTION_ENABLED:
            case PM_EO | ENCRYPTION_ENABLED | PINNING_ENABLED:
                return I18N.PM_ENCRYPT_SIGN;
            case PGP_INLINE | !ENCRYPTION_ENABLED | SIGNING_ENABLED:
                return I18N.PGP_SIGN;
            case PGP_INLINE | ENCRYPTION_ENABLED | SIGNING_ENABLED:
                return I18N.PGP_ENCRYPT_SIGN;
            case PINNING_ENABLED | ENCRYPTION_ENABLED | SIGNING_ENABLED: // Internal Pm pinned
                return I18N.PINNED_ENCRYPT_SIGN;
            case ENCRYPTION_ENABLED | SIGNING_ENABLED: // Internal Pm
                return I18N.PM_ENCRYPT_SIGN;
            default:
                return I18N.LOADING_CRYPT_INFO;
        }
    };

    return { getTooltip };
}
export default encryptionStatus;
