import { act, renderHook, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useApi } from '@proton/app-context/useApi';

import { useMembersLumoApi } from './useMembersLumoApi';

vi.mock('@proton/app-context/useApi');

const listUrl = 'core/v4/members/lumo-api';
const aliceAndBob = {
    Total: 2,
    Members: [
        { MemberID: 'member-alice', LumoApiEnabled: true },
        { MemberID: 'member-bob', LumoApiEnabled: false },
    ],
};

const setup = (api: Mock) => {
    (useApi as Mock).mockReturnValue(api);
    return renderHook(() => useMembersLumoApi());
};

const setupLoaded = async (api: Mock) => {
    api.mockResolvedValueOnce(aliceAndBob);
    const hook = setup(api);
    await waitFor(() => expect(hook.result.current.enabledByMemberId).toHaveProperty('member-bob'));
    return hook;
};

describe('useMembersLumoApi', () => {
    it('reads the API access of every member, page by page, without notifying on failure', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce({ Total: 151, Members: [{ MemberID: 'member-alice', LumoApiEnabled: true }] })
            .mockResolvedValueOnce({ Total: 151, Members: [{ MemberID: 'member-bob', LumoApiEnabled: false }] });

        const { result } = setup(api);

        await waitFor(() => expect(result.current.enabledByMemberId).toHaveProperty('member-bob'));
        expect(api.mock.calls.map(([config]) => config)).toEqual([
            { url: listUrl, method: 'get', params: { Page: 0, PageSize: 150 }, silence: true },
            { url: listUrl, method: 'get', params: { Page: 1, PageSize: 150 }, silence: true },
        ]);
        expect(result.current).toMatchObject({
            enabledByMemberId: { 'member-alice': true, 'member-bob': false },
            error: false,
        });
    });

    it('reports an error when the API access cannot be read', async () => {
        const { result } = setup(vi.fn().mockRejectedValue(new Error('503')));

        await waitFor(() => expect(result.current.error).toBe(true));
        expect(result.current.enabledByMemberId).toEqual({});
    });

    it('saves a member’s API access, then shows it next to the others', async () => {
        const api = vi.fn();
        const { result } = await setupLoaded(api);
        api.mockResolvedValueOnce({ Code: 1000 });

        await act(() => result.current.setApiAccess('member-bob', true));

        expect(api).toHaveBeenLastCalledWith({
            url: 'core/v4/members/member-bob/lumo-api',
            method: 'put',
            data: { LumoApiEnabled: true },
        });
        expect(result.current.enabledByMemberId).toEqual({ 'member-alice': true, 'member-bob': true });
    });

    it('saves everyone’s API access at once, then shows it for every member', async () => {
        const api = vi.fn();
        const { result } = await setupLoaded(api);
        api.mockResolvedValueOnce({ Code: 1000 });

        await act(() => result.current.setApiAccessForEveryone(false));

        expect(api).toHaveBeenLastCalledWith({
            url: listUrl,
            method: 'put',
            data: { LumoApiEnabled: false, AllMembers: true },
        });
        expect(result.current.enabledByMemberId).toEqual({ 'member-alice': false, 'member-bob': false });
    });

    it('keeps everyone’s API access when saving it for everyone fails', async () => {
        const api = vi.fn();
        const { result } = await setupLoaded(api);
        api.mockRejectedValueOnce(new Error('422'));

        await act(() => result.current.setApiAccessForEveryone(true));

        expect(result.current.enabledByMemberId).toEqual({ 'member-alice': true, 'member-bob': false });
    });

    it('keeps a member’s API access when saving it fails', async () => {
        const api = vi.fn();
        const { result } = await setupLoaded(api);
        api.mockRejectedValueOnce(new Error('422'));

        await act(() => result.current.setApiAccess('member-bob', true));

        expect(result.current.enabledByMemberId).toEqual({ 'member-alice': true, 'member-bob': false });
    });
});
