import { SEND_TYPES } from '../app/constants';

const extendPGP = (email, { encrypt, sign, scheme, pinned, ownAddress, warnings = [] }) => {
    return {
        ...email,
        encrypt,
        sign,
        isPgp: [SEND_TYPES.SEND_PGP_MIME, SEND_TYPES.SEND_PGP_INLINE].includes(scheme),
        isPgpMime: scheme === SEND_TYPES.SEND_PGP_MIME,
        isEO: scheme === SEND_TYPES.SEND_EO,
        isPinned: pinned && !ownAddress,
        ownAddress,
        loadCryptInfo: false,
        warnings
    };
};

export default extendPGP;
