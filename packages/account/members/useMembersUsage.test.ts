import { renderHook, waitFor } from '@testing-library/react';

import { useApi } from '@proton/app-context/useApi';
import type { MembersUsageResponse } from '@proton/shared/lib/api/members';

import { useMembersUsage } from './useMembersUsage';

jest.mock('@proton/app-context/useApi');
jest.mock('@proton/shared/lib/api/helpers/customConfig', () => ({
    getSilentApi: (api: unknown) => api,
}));

const mockedUseApi = useApi as jest.MockedFunction<typeof useApi>;

const response: MembersUsageResponse = {
    Code: 1000,
    ColumnDisplay: { Activity: 'data', Connection: 'enable' },
    UsageByMemberID: {
        a: { LastActivity: 1_700_000_000, LastConnection: { LastConnectionTime: 1_700_000_500, Gateway: 'Frankfurt' } },
    },
};

const noMembers: string[] = [];
const memberA: string[] = ['a'];
const memberB: string[] = ['b'];
const membersAB: string[] = ['a', 'b'];

describe('useMembersUsage', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('does not call the API when there are no member IDs', () => {
        const api = jest.fn().mockResolvedValue(response);
        mockedUseApi.mockReturnValue(api);

        const { result } = renderHook(() => useMembersUsage(noMembers));

        expect(api).not.toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
        expect(result.current.usageByMemberID).toEqual({});
    });

    it('does not call the API when disabled', () => {
        const api = jest.fn().mockResolvedValue(response);
        mockedUseApi.mockReturnValue(api);

        const { result } = renderHook(() => useMembersUsage(membersAB, false));

        expect(api).not.toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
        expect(result.current.usageByMemberID).toEqual({});
    });

    it('fetches once it becomes enabled', async () => {
        const api = jest.fn().mockResolvedValue(response);
        mockedUseApi.mockReturnValue(api);

        const { result, rerender } = renderHook(
            ({ enabled }: { enabled: boolean }) => useMembersUsage(membersAB, enabled),
            { initialProps: { enabled: false } }
        );

        expect(api).not.toHaveBeenCalled();

        rerender({ enabled: true });

        await waitFor(() => expect(result.current.columnDisplay).toEqual(response.ColumnDisplay));
        expect(api).toHaveBeenCalledTimes(1);
    });

    it('sends the visible member IDs in the request body', async () => {
        const api = jest.fn().mockResolvedValue(response);
        mockedUseApi.mockReturnValue(api);

        const { result } = renderHook(() => useMembersUsage(membersAB));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(api).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'post',
                url: 'vpn/v1/business/members/usage',
                data: { MemberIDs: ['a', 'b'] },
            })
        );
    });

    it('exposes columnDisplay + usageByMemberID from the response', async () => {
        const api = jest.fn().mockResolvedValue(response);
        mockedUseApi.mockReturnValue(api);

        const { result } = renderHook(() => useMembersUsage(membersAB));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.columnDisplay).toEqual({ Activity: 'data', Connection: 'enable' });
        expect(result.current.usageByMemberID.a?.LastConnection?.Gateway).toBe('Frankfurt');
        expect(result.current.error).toBeNull();
    });

    it('refetches when the member ID set changes', async () => {
        const api = jest.fn().mockResolvedValue(response);
        mockedUseApi.mockReturnValue(api);

        const { result, rerender } = renderHook(({ ids }: { ids: string[] }) => useMembersUsage(ids), {
            initialProps: { ids: memberA },
        });
        await waitFor(() => expect(result.current.loading).toBe(false));

        rerender({ ids: membersAB });
        await waitFor(() => expect(api).toHaveBeenCalledTimes(2));

        expect(api).toHaveBeenLastCalledWith(expect.objectContaining({ data: { MemberIDs: ['a', 'b'] } }));
    });

    it('does not refetch when re-rendered with the same member IDs', async () => {
        const api = jest.fn().mockResolvedValue(response);
        mockedUseApi.mockReturnValue(api);

        const { result, rerender } = renderHook(() => useMembersUsage(membersAB));

        await waitFor(() => expect(result.current.loading).toBe(false));

        rerender();
        rerender();

        expect(api).toHaveBeenCalledTimes(1);
    });

    it('does not refetch when a member is edited (new array, same IDs)', async () => {
        const api = jest.fn().mockResolvedValue(response);
        mockedUseApi.mockReturnValue(api);

        const { result, rerender } = renderHook(({ ids }: { ids: string[] }) => useMembersUsage(ids), {
            initialProps: { ids: ['a', 'b'] },
        });

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Same IDs, different array identity (and order): editing a member must not trigger a new request.
        rerender({ ids: ['b', 'a'] });
        rerender({ ids: ['a', 'b'] });

        expect(api).toHaveBeenCalledTimes(1);
    });

    it('exposes the error and does not throw when the request fails', async () => {
        const api = jest.fn().mockRejectedValue(new Error('boom'));
        mockedUseApi.mockReturnValue(api);

        const { result } = renderHook(() => useMembersUsage(memberA));

        await waitFor(() => expect(result.current.error).toEqual(new Error('boom')));
        expect(result.current.loading).toBe(false);
        expect(result.current.columnDisplay).toBeUndefined();
    });

    it('ignores an aborted (stale) request so it cannot overwrite fresher data', async () => {
        // The stale request only settles by rejecting when aborted (mirrors the real api honouring the signal).
        const api = jest.fn().mockImplementation((config) => {
            if (config.data.MemberIDs.join(',') === 'b') {
                return Promise.resolve(response);
            }
            return new Promise((_resolve, reject) => {
                config.signal.addEventListener('abort', () => {
                    const abortError = new Error('aborted');
                    abortError.name = 'AbortError';
                    reject(abortError);
                });
            });
        });
        mockedUseApi.mockReturnValue(api);

        const { result, rerender } = renderHook(({ ids }: { ids: string[] }) => useMembersUsage(ids), {
            initialProps: { ids: memberA },
        });

        // Switch to 'b' before 'a' settles: the effect aborts 'a', then 'b' resolves and must win.
        rerender({ ids: memberB });

        await waitFor(() => expect(result.current.columnDisplay).toEqual(response.ColumnDisplay));
        expect(result.current.error).toBeNull();
    });
});
