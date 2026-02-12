import { c } from 'ttag';

import { Pill } from '@proton/atoms/Pill/Pill';

import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { hasDeclinedFeatureFlag } from '../../utils/whatsNewStorage';

interface DismissedFeaturePillProps {
    featureId: string;
    versionFlag: string;
}

/**
 * Shows a "New" pill when:
 * 1. WhatsNewV1p3 feature flag is enabled globally
 * 2. AND the specified feature has been declined by the user
 */
export const DismissedFeaturePill = ({ featureId, versionFlag }: DismissedFeaturePillProps) => {
    const { whatsNew: isWhatsNewEnabled } = useLumoFlags();
    const isGuest = useIsGuest();
    const { isDeclined } = useFeatureFlags();

    // For guests, check localStorage; for authenticated users, check Redux
    const isFeatureDeclined = isGuest
        ? hasDeclinedFeatureFlag(featureId, versionFlag)
        : isDeclined(featureId, versionFlag);

    const shouldShow = isWhatsNewEnabled && isFeatureDeclined;

    if (!shouldShow) {
        return null;
    }

    return (
        <Pill backgroundColor="#D4EFD2" rounded="rounded-sm" className="self-start mr-0.5">
            {c('collider_2025: Feature').t`New`}
        </Pill>
    );
};
