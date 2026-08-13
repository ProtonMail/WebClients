import type { OrganizationExtended } from '@proton/shared/lib/interfaces';

/**
 * Whether the user's organisation enforces password check-ins.
 *
 * When enforced, the API ignores the member's own opt-out and keeps scheduling
 * reminders, so the member cannot turn them off. Individual (non-org) users are
 * never enforced.
 */
export const getIsPasswordReminderEnforced = ({ organization }: { organization?: OrganizationExtended }) => {
    return Boolean(organization?.Settings?.PasswordReminderEnforced);
};
