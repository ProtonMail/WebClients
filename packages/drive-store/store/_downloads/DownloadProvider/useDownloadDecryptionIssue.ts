import { useSharesStore } from '../../../zustand/share/shares.store';
import { integrityMetrics } from '../../_crypto';
import { getShareTypeString } from '../../_shares';
import { useIsPaid } from '../../_user';
import type { LinkDownload } from '../interface';

export default function useDownloadDecryptionIssue() {
    const getShare = useSharesStore((state) => state.getShare);
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
