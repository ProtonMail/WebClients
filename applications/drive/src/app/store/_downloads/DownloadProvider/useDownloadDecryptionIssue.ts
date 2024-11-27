import { integrityMetrics } from '../../_crypto';
import { getShareTypeString } from '../../_shares';
import useSharesState from '../../_shares/useSharesState';
import { useIsPaid } from '../../_user';
import type { LinkDownload } from '../interface';

export default function useDownloadDecryptionIssue() {
    const { getShare } = useSharesState();
    const isPaid = useIsPaid();

    const handleDecryptionIssue = (link: LinkDownload): void => {
        const share = getShare(link.shareId);
        const shareType = getShareTypeString(share);
        integrityMetrics.contentDecryptionError(link.linkId, shareType, {
            createTime: link.createTime,
            isPaid,
        });
    };

    return {
        handleDecryptionIssue,
    };
}
