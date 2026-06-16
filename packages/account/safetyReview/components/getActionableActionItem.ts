import type { SafetyReviewContainerState } from '@proton/account/safetyReview/components/interface';
import type { RecoveryStateResult } from '@proton/account/safetyReview/recoveryState/recoveryState';

export const getActionableActionItem = (
    value: RecoveryStateResult['recoveryActionItems'][number],
    actionsHistoryMap: SafetyReviewContainerState['actionsHistoryMap'],
    isPasswordReminderInASREnabled: boolean
) => {
    // We always show password verification as the first step
    if (value.id === 'passwordVerification' && value.recoveryItem.isAvailable) {
        return isPasswordReminderInASREnabled ? !actionsHistoryMap.has(value.id) : false;
    }

    return value.recoveryItem.isAvailable && !value.recoveryItem.isEnabled && !actionsHistoryMap.has(value.id);
};
