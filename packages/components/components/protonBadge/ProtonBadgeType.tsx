import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import type { Recipient } from '@proton/shared/lib/interfaces/Address';

import VerifiedBadge from './VerifiedBadge';

interface Props {
    recipient: Recipient;
    selected?: boolean;
}

const ProtonBadgeType = ({ recipient, selected }: Props) => {
    const { feature: protonBadgeFeature } = useFeature(FeatureCode.ProtonBadge);
    const canDisplayAuthenticityBadge = !!recipient.IsProton && protonBadgeFeature?.Value;

    if (canDisplayAuthenticityBadge) {
        return <VerifiedBadge selected={selected} />;
    }

    return null;
};

export default ProtonBadgeType;
