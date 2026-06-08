import type { RecoverySettingsScoreBannerVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';
import { useVariant } from '@proton/unleash/useVariant';

export const useRecoveryScoreBannerVariant = (): RecoverySettingsScoreBannerVariant => {
    const { name } = useVariant('RecoverySettingsScoreBanner');
    // Flag disabled or variant is B1 → fall back to B1 (current experience)
    // Only explicitly assigned B2 gets the new banner
    return name === 'B2' ? 'B2' : 'B1';
};
