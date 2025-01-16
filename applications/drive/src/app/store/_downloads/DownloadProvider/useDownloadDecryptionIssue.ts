import { getIsPublicContext } from '../../../utils/getIsPublicContext';
import { useSharesStore } from '../../../zustand/share/shares.store';
import { integrityMetrics } from '../../_crypto';
import { getShareTypeString } from '../../_shares';
import { useGetMetricsUserPlan } from '../../_user/useGetMetricsUserPlan';
import type { LinkDownload } from '../interface';

export default function useDownloadDecryptionIssue() {
    const getShare = useSharesStore((state) => state.getShare);
    const userPlan = useGetMetricsUserPlan();

    const handleDecryptionIssue = (link: LinkDownload): void => {
        const share = getShare(link.shareId);
        const shareType = getIsPublicContext() ? 'shared_public' : getShareTypeString(share);
        integrityMetrics.contentDecryptionError(link.linkId, shareType, {
            createTime: link.createTime,
            plan: userPlan,
        });
    };

    return {
        handleDecryptionIssue,
    };
}
