import type { EnhancedMember } from '@proton/shared/lib/interfaces/Member';

import { ItemStatus, OrgKeyDemotionApproval, getOrgKeyDemotionStatus } from './index';

const getMember = (
    member: Partial<Pick<EnhancedMember, 'roleState' | 'requiresOrgKeyDemotion' | 'hasScheduledOrgKeyDemotion'>>
) => ({
    roleState: 'full' as const,
    requiresOrgKeyDemotion: true,
    hasScheduledOrgKeyDemotion: false,
    ...member,
});

describe('getOrgKeyDemotionStatus', () => {
    it.each(Object.values(OrgKeyDemotionApproval))(
        'is completed once the member no longer requires demotion (approval: %s)',
        (approval) => {
            expect(getOrgKeyDemotionStatus(getMember({ requiresOrgKeyDemotion: false }), approval)).toBe(
                ItemStatus.Completed
            );
        }
    );

    it('is completed when the member is gone', () => {
        expect(getOrgKeyDemotionStatus(undefined, OrgKeyDemotionApproval.Enqueued)).toBe(ItemStatus.Completed);
    });

    it('has no status of its own before approving, even without a scheduled task', () => {
        expect(getOrgKeyDemotionStatus(getMember({}), OrgKeyDemotionApproval.None)).toBe(ItemStatus.Unknown);
    });

    it.each(Object.values(OrgKeyDemotionApproval))(
        'is scheduled as soon as the demotion task exists (approval: %s)',
        (approval) => {
            expect(getOrgKeyDemotionStatus(getMember({ hasScheduledOrgKeyDemotion: true }), approval)).toBe(
                ItemStatus.Scheduled
            );
        }
    );

    it('is pending while the flags have not been re-read since approving', () => {
        expect(getOrgKeyDemotionStatus(getMember({}), OrgKeyDemotionApproval.Requested)).toBe(ItemStatus.Finalizing);
    });

    it.each(['stale', 'pending'] as const)(
        'is pending while the flags are not freshly loaded (roleState: %s)',
        (roleState) => {
            expect(getOrgKeyDemotionStatus(getMember({ roleState }), OrgKeyDemotionApproval.Enqueued)).toBe(
                ItemStatus.Finalizing
            );
        }
    );

    it.each(['full', 'rejected'] as const)(
        'is failed when no task is scheduled after approving, or the flags cannot be re-read (roleState: %s)',
        (roleState) => {
            expect(getOrgKeyDemotionStatus(getMember({ roleState }), OrgKeyDemotionApproval.Enqueued)).toBe(
                ItemStatus.Failed
            );
        }
    );
});
