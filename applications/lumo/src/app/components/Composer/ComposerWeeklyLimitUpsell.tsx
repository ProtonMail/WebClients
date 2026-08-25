import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useLumoSelector } from '../../redux/hooks';
import { selectTierErrors } from '../../redux/slices/meta/errors';
import { shouldShowWeeklyLimitUpsell, useRemainingLimits } from '../../services/usageLimitsStore';
import { ComposerMode } from '../../types';
import UpsellCard from '../../upsells/components/UpsellCard';

interface Props {
    composerMode: ComposerMode;
}

/**
 * Weekly chat quota upsell shown above the composer when all model pools are exhausted.
 * Rendered from ComposerComponent so every composer surface gets consistent limit UX.
 */
export const ComposerWeeklyLimitUpsell = ({ composerMode }: Props) => {
    const tierErrors = useLumoSelector(selectTierErrors);
    const { hasLumoPlus } = useLumoPlan();
    const remainingLimits = useRemainingLimits();
    const showWeeklyLimitUpsell = shouldShowWeeklyLimitUpsell(remainingLimits, tierErrors.length > 0, hasLumoPlus);

    if (!showWeeklyLimitUpsell || !tierErrors[0]) {
        return null;
    }

    return <UpsellCard showSadCat={composerMode !== ComposerMode.NEW_CONVERSATION} error={tierErrors[0]} />;
};

export default ComposerWeeklyLimitUpsell;
