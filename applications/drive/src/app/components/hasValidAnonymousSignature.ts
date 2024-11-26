import { VERIFICATION_STATUS } from '@proton/srp/lib/constants';

import { type SignatureIssues } from '../store';

export const hasValidAnonymousSignature = (signatureIssues: SignatureIssues) => {
    return Object.entries(signatureIssues).every(([key, verified]) => {
        if (key === 'thumbnail' || key === 'blocks') {
            if (verified === VERIFICATION_STATUS.NOT_SIGNED) {
                return true;
            } else {
                console.warn(`${key} signature should not be signed in case of anonymous upload`);
                return false;
            }
        } else {
            return verified === VERIFICATION_STATUS.SIGNED_AND_VALID;
        }
    });
};
