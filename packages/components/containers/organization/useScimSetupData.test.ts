import { act, renderHook } from '@testing-library/react';

import { Phase } from '@proton/account/scimSetup';
import type { EnhancedMember } from '@proton/shared/lib/interfaces/Member';

import useScimSetupData, { ItemStatus } from './useScimSetupData';

let mockMembers: EnhancedMember[] = [];
const mockDispatch = vi.fn();

vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => true }));
vi.mock('@proton/account/groupMembers/hooks', () => ({ useGetGroupMembers: () => vi.fn() }));
vi.mock('@proton/account/groups/hooks', () => ({ useGroups: () => [[]] }));
vi.mock('@proton/account/members/hooks', () => ({ useMembers: () => [mockMembers] }));
vi.mock('@proton/account/members/useMemberRoles', () => ({ useMemberRoles: vi.fn() }));
vi.mock('@proton/app-context/useApi', () => ({ useApi: () => vi.fn() }));
vi.mock('@proton/redux-shared-store/sharedProvider', () => ({
    useDispatch: () => mockDispatch,
    useSelector: () => [],
}));
vi.mock('../../hooks/useErrorHandler', () => ({ __esModule: true, default: () => vi.fn() }));
vi.mock('./groups/useGroupKeys', () => ({ __esModule: true, default: () => ({ getMemberPublicKeys: vi.fn() }) }));
vi.mock('@proton/account/scimSetup/actions', async () => ({
    approveScimChanges: async function* () {
        const { OrgKeyDemotionApproval, Phase } = await vi.importActual<any>('@proton/account/scimSetup');
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
        vi.useFakeTimers();
        mockDispatch.mockReset();
        mockDispatch.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
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

        await act(() => vi.advanceTimersByTimeAsync(60000));

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('allows approving again after a reset', async () => {
        const { result } = await setup();

        act(() => result.current.resetApproval());

        expect(result.current.phase).toBe(Phase.Idle);
        expect(result.current.orgKeyDemotionStatuses.failed).toBe(ItemStatus.Unknown);
    });
});
