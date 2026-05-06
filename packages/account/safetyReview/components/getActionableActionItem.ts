import type { SafetyReviewContainerState } from '@proton/account/safetyReview/components/interface';
import type { RecoveryStateResult } from '@proton/account/safetyReview/recoveryState/recoveryState';

export const getActionableActionItem = (
    value: RecoveryStateResult['recoveryActionItems'][number],
    actionsHistoryMap: SafetyReviewContainerState['actionsHistoryMap']
) => {
    return value.recoveryItem.isAvailable && !value.recoveryItem.isEnabled && !actionsHistoryMap.has(value.id);
};
