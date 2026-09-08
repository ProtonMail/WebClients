import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { useLumoPlan } from '../../hooks/useLumoPlan';
import { getSelectedModelTier, useModelTier } from '../../providers/ModelTierProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectTierErrors } from '../../redux/slices/meta/errors';
import {
    getDismissibleExhaustedModel,
    isModelTierLimitExhausted,
    shouldShowLimitUpsell,
    useExhaustedLimitNotice,
    useRemainingLimits,
} from '../../services/usageLimitsStore';
import { ComposerMode } from '../../types';
import UpsellCard from '../../upsells/components/UpsellCard';
import { getExceededTierErrorTitle } from '../../util/errorMessages';
import { getModelDisplayName } from '../../util/modelTierDisplay';
import {
    type ExhaustedModel,
    hasDismissedModelLimitUpsell,
    markModelLimitUpsellDismissed,
} from '../../util/modelLimitUpsellStorage';

interface Props {
    composerMode: ComposerMode;
}

/**
 * Model quota upsell shown after a chat-model pool is exhausted.
 * Rendered from ComposerComponent so every composer surface gets consistent limit UX.
 */
export const ComposerModelLimitUpsell = ({ composerMode }: Props) => {
    const tierErrors = useLumoSelector(selectTierErrors);
    const { hasLumoPlus } = useLumoPlan();
    const { modelTier } = useModelTier();
    const selectedModelTier = getSelectedModelTier(modelTier);
    const remainingLimits = useRemainingLimits();
    const exhaustedLimitNotice = useExhaustedLimitNotice();
    const showLimitUpsell =
        exhaustedLimitNotice !== null &&
        shouldShowLimitUpsell(
            remainingLimits,
            tierErrors.length > 0,
            hasLumoPlus,
            exhaustedLimitNotice.modelTier
        );
    const dismissibleModel = getDismissibleExhaustedModel(remainingLimits);
    const [dismissedModels, setDismissedModels] = useState<Set<ExhaustedModel>>(
        () => new Set((['lite', 'max'] as ExhaustedModel[]).filter(hasDismissedModelLimitUpsell))
    );
    const isDismissed = dismissibleModel !== undefined && dismissedModels.has(dismissibleModel);

    const handleDismiss = useCallback(() => {
        if (!dismissibleModel) {
            return;
        }

        markModelLimitUpsellDismissed(dismissibleModel);
        setDismissedModels((current) => new Set(current).add(dismissibleModel));
    }, [dismissibleModel]);

    if (!showLimitUpsell || !tierErrors[0] || isDismissed) {
        return null;
    }

    const selectedModelLabel = getModelDisplayName(selectedModelTier);
    const fallbackUpsellMessage = tierErrors[0].errorMessage;

    const error = {
        ...tierErrors[0],
        errorTitle: getExceededTierErrorTitle(remainingLimits, exhaustedLimitNotice.modelTier),
        ...(!isModelTierLimitExhausted(selectedModelTier, remainingLimits) &&
            selectedModelTier !== exhaustedLimitNotice.modelTier && {
                errorMessage: c('collider_2025: Error Message')
                    .t`We've switched you to ${selectedModelLabel}, which is still available. ${fallbackUpsellMessage}`,
            }),
    };

    return (
        <UpsellCard
            showSadCat={composerMode !== ComposerMode.NEW_CONVERSATION}
            error={error}
            onDismiss={dismissibleModel ? handleDismiss : undefined}
        />
    );
};

export default ComposerModelLimitUpsell;
