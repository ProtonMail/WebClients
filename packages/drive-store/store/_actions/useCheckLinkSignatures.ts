import { VERIFICATION_STATUS } from '@proton/crypto/lib/constants';
import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { sendErrorReport } from '../../utils/errorHandling';
import type useDownload from '../_downloads/useDownload';
import { useLink } from '../_links';

export const useCheckLinkSignatures = ({
    checkFirstBlockSignature,
}: {
    checkFirstBlockSignature: ReturnType<typeof useDownload>['checkFirstBlockSignature'];
}) => {
    const { getLink, getLinkPrivateKey, getLinkSessionKey, getLinkHashKey } = useLink();
    /**
     * checkLinkMetaSignatures checks for all signatures of various attributes:
     * passphrase, hash key, name or xattributes. It does not check content,
     * that is file blocks including thumbnail block.
     */
    const checkLinkMetaSignatures = async (abortSignal: AbortSignal, shareId: string, linkId: string) => {
        const [link] = await Promise.all([
            // Decrypts name and xattributes.
            getLink(abortSignal, shareId, linkId),
            // Decrypts passphrase.
            getLinkPrivateKey(abortSignal, shareId, linkId),
        ]);
        if (link.isFile) {
            await getLinkSessionKey(abortSignal, shareId, linkId);
        } else {
            await getLinkHashKey(abortSignal, shareId, linkId);
        }
        // Get latest link with signature updates.
        return (await getLink(abortSignal, shareId, linkId)).signatureIssues;
    };

    const checkLinkSignatures = async (abortSignal: AbortSignal, shareId: string, linkId: string) => {
        const [metaSignatureIssues, blockSignatureIssue] = await Promise.all([
            checkLinkMetaSignatures(abortSignal, shareId, linkId),
            // To avoid the need to download the whole file we assume that
            // either all blocks fail, or none, at least in most cases. So it
            // should be enough to check only the first block. During download
            // we check every single block, so user is still protected.
            checkFirstBlockSignature(abortSignal, shareId, linkId),
        ]).catch((e) => {
            // Only network error can be thrown here to indicate the signature
            // couldn't be checked and user should try again. Any other case
            // such as a very bad data should be represented as missing
            // signature (technically the signature is not there - some other
            // malformed data is).
            if (getIsConnectionIssue(e)) {
                throw e;
            }
            sendErrorReport(e);
            return [
                {
                    passphrase: VERIFICATION_STATUS.NOT_SIGNED,
                    name: VERIFICATION_STATUS.NOT_SIGNED,
                    xattrs: VERIFICATION_STATUS.NOT_SIGNED,
                },
                {
                    contentKeyPacket: VERIFICATION_STATUS.NOT_SIGNED,
                    blocks: VERIFICATION_STATUS.NOT_SIGNED,
                    thumbnail: VERIFICATION_STATUS.NOT_SIGNED,
                },
            ];
        });
        if (!metaSignatureIssues && !blockSignatureIssue) {
            return;
        }
        return {
            ...metaSignatureIssues,
            ...blockSignatureIssue,
        };
    };

    return { checkLinkSignatures };
};
