import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';
import { VERIFICATION_STATUS } from '@proton/srp/lib/constants';

import { type SignatureIssues } from '../store';

export const hasValidAnonymousSignature = (
    signatureIssues: SignatureIssues | undefined,
    { mimeType, isFile }: { mimeType?: string; isFile: boolean }
) => {
    // Proton Documents and folder will not have any issue if uploaded anonymously
    // In anonymous upload on blocks and thumbnails are not signed.
    if (!signatureIssues) {
        if ((mimeType && isProtonDocument(mimeType)) || !isFile) {
            return true;
        } else {
            console.warn('Anonymous uploaded files should have thumbnail and blocks unsigned');
            return false;
        }
    }
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
