import { waitFor } from '@testing-library/react';

import { getServerEvent } from '@proton/account/test/getServerEvent';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { EVENT_ACTIONS, PRODUCT_BIT, USER_ROLES } from '@proton/shared/lib/constants';
import type { Domain, UserModel } from '@proton/shared/lib/interfaces';

import { getModelState } from '../test';
import { userReducer } from '../user';
import { domainsReducer, domainsThunk, selectDomains } from './index';

const defaultUser = {
    Flags: {},
} as UserModel;

describe('domains', () => {
    const setup = ({ user }: { user: UserModel }) => {
        const extraThunkArguments = {
            api: async () => {
                return { Domains: [{ ID: '1' }] };
            },
        } as unknown as ProtonThunkArguments;
        return getTestStore({
            reducer: { ...userReducer, ...domainsReducer },
            preloadedState: {
                user: getModelState(user),
            },
            extraThunkArguments,
        });
    };

    const getState = (value: any, type: any) => {
        return {
            ...getModelState(value),
            meta: {
                type,
            },
        };
    };

    it('should not fetch domains for a free user', async () => {
        const { store } = setup({ user: { ...defaultUser, Role: USER_ROLES.FREE_ROLE } });
        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toMatchObject(getState([], 0));
    });

    it('should fetch domains for a paid user', async () => {
        const { store } = setup({
            user: {
                ...defaultUser,
                Role: USER_ROLES.ADMIN_ROLE,
                Subscribed: PRODUCT_BIT.VPN,
            },
        });
        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toMatchObject(getState([{ ID: '1' }], 1));
        store.dispatch(
            getServerEvent({ Domains: [{ ID: '2', Domain: { ID: '2' } as Domain, Action: EVENT_ACTIONS.CREATE }] })
        );
        expect(selectDomains(store.getState())).toMatchObject(getState([{ ID: '1' }, { ID: '2' }], 1));
    });

    it('should clear domains for a downgraded user', async () => {
        const { store } = setup({
            user: {
                ...defaultUser,
                Role: USER_ROLES.ADMIN_ROLE,
                Subscribed: PRODUCT_BIT.MAIL,
            },
        });
        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toMatchObject(getState([{ ID: '1' }], 1));
        store.dispatch(
            getServerEvent({ Domains: [{ ID: '2', Domain: { ID: '2' } as Domain, Action: EVENT_ACTIONS.CREATE }] })
        );
        expect(selectDomains(store.getState())).toMatchObject(getState([{ ID: '1' }, { ID: '2' }], 1));
        store.dispatch(getServerEvent({ User: { ...defaultUser, Subscribed: 0 } }));
        await waitFor(() => expect(selectDomains(store.getState())).toMatchObject(getState([], 0)));
    });
});
