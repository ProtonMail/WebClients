import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useLumoSelector } from '../../redux/hooks';
import { selectTierErrors } from '../../redux/slices/meta/errors';
import { shouldShowLimitUpsell, useRemainingLimits } from '../../services/usageLimitsStore';
import { ComposerMode } from '../../types';
import UpsellCard from '../../upsells/components/UpsellCard';
import { getExceededTierErrorTitle } from '../../util/errorMessages';

interface Props {
    composerMode: ComposerMode;
}

/**
 * Quota upsell shown above the composer when either chat-model pool is exhausted.
 * Rendered from ComposerComponent so every composer surface gets consistent limit UX.
 */
export const ComposerWeeklyLimitUpsell = ({ composerMode }: Props) => {
    const tierErrors = useLumoSelector(selectTierErrors);
    const { hasLumoPlus } = useLumoPlan();
    const remainingLimits = useRemainingLimits();
    const showLimitUpsell = shouldShowLimitUpsell(remainingLimits, tierErrors.length > 0, hasLumoPlus);

    if (!showLimitUpsell || !tierErrors[0]) {
        return null;
    }

    const error = {
        ...tierErrors[0],
        errorTitle: getExceededTierErrorTitle(remainingLimits),
    };

    return <UpsellCard showSadCat={composerMode !== ComposerMode.NEW_CONVERSATION} error={error} />;
};

export default ComposerWeeklyLimitUpsell;
