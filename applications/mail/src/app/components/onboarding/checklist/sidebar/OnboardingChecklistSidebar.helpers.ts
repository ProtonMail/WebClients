import { differenceInDays } from 'date-fns';

export function getOnboardingChecklistCompletionState(
    createdAt: Date,
    expiresAt: Date
): {
    /** Remaining days to complete checklist */
    remainingDaysCount: number;
    /** Whether the user has reached the checklist completion time limit */
    hasReachedLimit: boolean;
} {
    const checklistCompletionDaysLeft = differenceInDays(expiresAt, createdAt);
    const isChecklistCompletionLimitReached = expiresAt < new Date();

    return {
        remainingDaysCount: isChecklistCompletionLimitReached ? 0 : checklistCompletionDaysLeft,
        hasReachedLimit: isChecklistCompletionLimitReached,
    };
}
