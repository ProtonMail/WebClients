import type { ReactNode } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import type { Member } from '@proton/shared/lib/interfaces/Member';

import { TestStoreProvider } from '../testing/TestStoreProvider';
import { membersActions, membersReducer } from './index';
import { membersPageReducer } from './membersPage';
import { useMembersRemote } from './useMembersRemote';

const setup = () => {
    const api = vi.fn(async () => ({ Members: [{ ID: 'a', Name: 'a' } as Member], Total: 1 }));
    const { store } = getTestStore({
        reducer: { ...membersPageReducer, ...membersReducer },
        extraThunkArguments: { api } as unknown as ProtonThunkArguments,
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
        <TestStoreProvider store={store}>{children}</TestStoreProvider>
    );
    // The list that a big batch of member events refetches
    const reloadMembersList = () => store.dispatch(membersActions.fulfilled({ value: [], type: 1 }));
    return { api, wrapper, reloadMembersList };
};

describe('useMembersRemote', () => {
    it('fetches the page again when the members list reloads', async () => {
        const { api, wrapper, reloadMembersList } = setup();
        const { result } = renderHook(() => useMembersRemote({ pageSize: 10 }), { wrapper });
        await waitFor(() => expect(result.current.data).toHaveLength(1));
        expect(api).toHaveBeenCalledTimes(1);

        act(() => {
            reloadMembersList();
        });

        await waitFor(() => expect(api).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it('fetches once when the members list reloaded while no page was shown', async () => {
        const { api, wrapper, reloadMembersList } = setup();
        reloadMembersList();

        const { result } = renderHook(() => useMembersRemote({ pageSize: 10 }), { wrapper });

        await waitFor(() => expect(result.current.data).toHaveLength(1));
        expect(api).toHaveBeenCalledTimes(1);
    });
});
