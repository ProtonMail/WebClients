import { VERIFICATION_STATUS } from '@proton/crypto';
import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { sendErrorReport } from '../../utils/errorHandling';
import { useDriveCrypto } from '../_crypto';
import { useDownload } from '../_downloads';
import { useLink } from '../_links';
import { decryptExtendedAttributes } from '../_links/extendedAttributes';

const useRevisions = (shareId: string, linkId: string) => {
    const { checkFirstBlockSignature } = useDownload();
    const { getVerificationKey } = useDriveCrypto();
    const { getLinkPrivateKey } = useLink();

    const getRevisionDecryptedXattrs = async (
        abortSignal: AbortSignal,
        revisionEncryptedXattr: string | undefined,
        revisionSignatureAddress: string
    ) => {
        if (!revisionEncryptedXattr) {
            return;
        }
        try {
            const keys = await getVerificationKey(revisionSignatureAddress);
            const privateKey = await getLinkPrivateKey(abortSignal, shareId, linkId);
            const { xattrs, verified } = await decryptExtendedAttributes(revisionEncryptedXattr, privateKey, keys);
            return {
                xattrs,
                signatureIssues: {
                    xattrs: verified,
                },
            };
        } catch (err) {
            sendErrorReport(err);
            return;
        }
    };

    const checkRevisionSignature = (abortSignal: AbortSignal, revisionId: string) => {
        return checkFirstBlockSignature(abortSignal, shareId, linkId, revisionId).catch((e) => {
            if (getIsConnectionIssue(e)) {
                throw e;
            }
            sendErrorReport(e);
            return {
                contentKeyPacket: VERIFICATION_STATUS.NOT_SIGNED,
                blocks: VERIFICATION_STATUS.NOT_SIGNED,
                thumbnail: VERIFICATION_STATUS.NOT_SIGNED,
            };
        });
    };

    return {
        getRevisionDecryptedXattrs,
        checkRevisionSignature,
    };
};

export default useRevisions;
