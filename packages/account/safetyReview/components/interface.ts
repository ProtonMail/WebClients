import type { SafetyReviewCardsItemProps } from '@proton/account/safetyReview/components/cards/interface';

import type { RecoveryActionItem, RecoveryActionItemsIds, RecoveryStateResult } from '../recoveryState/recoveryState';
import type { SafetyReviewBackLink } from './getSafetyReviewBackLink';

export type PartialSafetyReviewContainerState = {
    actionsHistoryMap: Map<RecoveryActionItemsIds, { type: 'completed' | 'skipped' }>;
    recoveryState: RecoveryStateResult;
    actionableRecoveryActionItems: RecoveryActionItem[];
    visibleActionableRecoveryActionItems: RecoveryActionItem[];
    remainingItems: number;
};
export type SafetyReviewContainerState = PartialSafetyReviewContainerState & {
    backLink: SafetyReviewBackLink;
};

export type SafetyReviewActionResult = 'completed' | 'skipped';

export type SafetyReviewContainerActions = {
    next: (direction: SafetyReviewActionResult, item: RecoveryActionItem) => void;
    restart: () => void;
};

export type SafetyReviewContainerProps = {
    footerEl: HTMLElement | null;
    safetyReview: {
        state: SafetyReviewContainerState;
        actions: SafetyReviewContainerActions;
    };
};

export type SafetyReviewAllProps = SafetyReviewContainerProps & SafetyReviewCardsItemProps;
