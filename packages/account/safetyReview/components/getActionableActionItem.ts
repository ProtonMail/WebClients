import type { SafetyReviewContainerState } from '@proton/account/safetyReview/components/interface';
import type { RecoveryStateResult } from '@proton/account/safetyReview/recoveryState/recoveryState';

export const getActionableActionItem = (
    value: RecoveryStateResult['recoveryActionItems'][number],
    actionsHistoryMap: SafetyReviewContainerState['actionsHistoryMap']
) => {
    // We always show password verification as the first step irrespective of their reminder cycle
    if (value.id === 'passwordVerification') {
        return value.recoveryItem.isAvailable && !actionsHistoryMap.has(value.id);
    }

    return value.recoveryItem.isAvailable && !value.recoveryItem.isEnabled && !actionsHistoryMap.has(value.id);
};
