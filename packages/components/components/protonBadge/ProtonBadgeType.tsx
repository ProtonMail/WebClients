import { FeatureCode } from '@proton/components/containers';
import { useFeature } from '@proton/components/hooks';
import { Recipient } from '@proton/shared/lib/interfaces';

import VerifiedBadge from './badgeTypes/VerifiedBadge';

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
