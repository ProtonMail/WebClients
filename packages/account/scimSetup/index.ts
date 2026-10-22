import type { EnhancedMember } from '@proton/shared/lib/interfaces/Member';

export * from './selectors';

export enum ItemStatus {
    Waiting = 'waiting',
    Finalizing = 'finalizing',
    Completed = 'completed',
    Unknown = 'unknown',
    Failed = 'failed',
    Scheduled = 'scheduled',
}

export enum Phase {
    Idle = 'idle',
    Working = 'working',
    Done = 'done',
}

export enum OrgKeyDemotionApproval {
    None = 'none',
    // The demotions were requested, but the members' flags haven't been re-read since
    Requested = 'requested',
    Enqueued = 'enqueued',
}

/**
 * Status of a member listed for org key removal. Demotions run as async tasks, so a scheduled task already counts
 * as success. The API might not start tasks for all requested members, so we need to re-read the member's flags
 * instead of relying on the request's response.
 */
export const getOrgKeyDemotionStatus = (
    member: Pick<EnhancedMember, 'roleState' | 'requiresOrgKeyDemotion' | 'hasScheduledOrgKeyDemotion'> | undefined,
    approval: OrgKeyDemotionApproval
): ItemStatus => {
    if (!member?.requiresOrgKeyDemotion) {
        return ItemStatus.Completed;
    }

    if (member.hasScheduledOrgKeyDemotion) {
        return ItemStatus.Scheduled;
    }

    // Not having a scheduled task is the normal state before approving, not a failure
    if (approval === OrgKeyDemotionApproval.None) {
        return ItemStatus.Unknown;
    }

    // Until the flags are re-read after approving, they can't tell a missing task from one not yet seen.
    // A failed re-read counts as failed, as approving again is safe.
    if (
        approval === OrgKeyDemotionApproval.Requested ||
        (member.roleState !== 'full' && member.roleState !== 'rejected')
    ) {
        return ItemStatus.Finalizing;
    }

    return ItemStatus.Failed;
};

export interface ScimSetupSliceState {
    phase: Phase;
    userStatuses: Record<string, ItemStatus>;
    groupStatuses: Record<string, ItemStatus>;
    groupMemberStatuses: Record<string, ItemStatus>;
}
