import { act, renderHook } from '@testing-library/react';

import { Phase } from '@proton/account/scimSetup';
import type { EnhancedMember } from '@proton/shared/lib/interfaces/Member';

import useScimSetupData, { ItemStatus } from './useScimSetupData';

let mockMembers: EnhancedMember[] = [];
const mockDispatch = jest.fn();

jest.mock('@proton/unleash/useFlag', () => ({ useFlag: () => true }));
jest.mock('@proton/account/groupMembers/hooks', () => ({ useGetGroupMembers: () => jest.fn() }));
jest.mock('@proton/account/groups/hooks', () => ({ useGroups: () => [[]] }));
jest.mock('@proton/account/members/hooks', () => ({ useMembers: () => [mockMembers] }));
jest.mock('@proton/account/members/useMemberRoles', () => ({ useMemberRoles: jest.fn() }));
jest.mock('@proton/app-context/useApi', () => ({ useApi: () => jest.fn() }));
jest.mock('@proton/redux-shared-store/sharedProvider', () => ({
    useDispatch: () => mockDispatch,
    useSelector: () => [],
}));
jest.mock('../../hooks/useErrorHandler', () => () => jest.fn());
jest.mock('./groups/useGroupKeys', () => () => ({ getMemberPublicKeys: jest.fn() }));
jest.mock('@proton/account/scimSetup/actions', () => ({
    approveScimChanges: async function* () {
        const { OrgKeyDemotionApproval, Phase } = jest.requireActual('@proton/account/scimSetup');
        yield { type: 'phase', phase: Phase.Working };
        yield { type: 'orgKeyDemotion', approval: OrgKeyDemotionApproval.Requested };
        yield { type: 'orgKeyDemotion', approval: OrgKeyDemotionApproval.Enqueued };
        yield { type: 'phase', phase: Phase.Done };
    },
}));

const getMember = (ID: string, hasScheduledOrgKeyDemotion: boolean) =>
    ({
        ID,
        roleState: 'full',
        requiresOrgKeyDemotion: true,
        hasScheduledOrgKeyDemotion,
    }) as unknown as EnhancedMember;

describe('useScimSetupData clean-up actions', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockDispatch.mockReset();
        mockDispatch.mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const setup = async () => {
        const scheduled = getMember('scheduled', true);
        const failed = getMember('failed', false);
        mockMembers = [scheduled, failed];
        const hook = renderHook(() => useScimSetupData());

        expect(hook.result.current.orgKeyDemotionStatuses).toEqual({
            scheduled: ItemStatus.Scheduled,
            failed: ItemStatus.Unknown,
        });

        await act(() => hook.result.current.approvePendingChanges([], [], [scheduled, failed]));

        return hook;
    };

    it('derives the statuses from the flags once approved', async () => {
        const { result } = await setup();

        expect(result.current.phase).toBe(Phase.Done);
        expect(result.current.orgKeyDemotionStatuses).toEqual({
            scheduled: ItemStatus.Scheduled,
            failed: ItemStatus.Failed,
        });
    });

    it('does not poll once approved, as a scheduled task already counts as success', async () => {
        await setup();
        mockDispatch.mockClear();

        await act(() => jest.advanceTimersByTimeAsync(60000));

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('allows approving again after a reset', async () => {
        const { result } = await setup();

        act(() => result.current.resetApproval());

        expect(result.current.phase).toBe(Phase.Idle);
        expect(result.current.orgKeyDemotionStatuses.failed).toBe(ItemStatus.Unknown);
    });
});
