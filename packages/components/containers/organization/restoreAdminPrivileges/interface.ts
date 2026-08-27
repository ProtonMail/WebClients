import type { Member } from '@proton/shared/lib/interfaces';

export type RestoreAdminPrivilegesStep =
    /** Attempt a data recovery method, which restores access to the organization key on its own. */
    | 'data-recovery'
    /** Ask another administrator with organization key access for help. */
    | 'contact-administrators'
    /** Confirm the reset when every member is already private and nothing has to be converted. */
    | 'reset-confirm'
    /** Explain what converting the non-private members implies. */
    | 'convert-users'
    /** Ask the administrator to notify the members before the requests go out. */
    | 'notify-users'
    /** The list of members that will be converted, reachable from the two steps above. */
    | 'users-list'
    /** The reset is running. */
    | 'resetting'
    | 'success';

export interface NonPrivateMembersProps {
    /** The members that will be temporarily converted to private */
    nonPrivateMembers: Member[];
    onShowUsers: () => void;
}
