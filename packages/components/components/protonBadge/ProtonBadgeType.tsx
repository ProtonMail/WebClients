import VerifiedBadge from '@proton/components/components/protonBadge/VerifiedBadge';
import { FeatureCode, useFeature } from '@proton/features';
import type { Recipient } from '@proton/shared/lib/interfaces';

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
