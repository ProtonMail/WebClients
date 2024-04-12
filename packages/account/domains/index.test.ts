import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { getTestStore } from '@proton/redux-shared-store/test';
import { EVENT_ACTIONS, PRODUCT_BIT, USER_ROLES } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { serverEvent } from '../eventLoop';
import { getModelState } from '../test';
import { userReducer } from '../user';
import { domainsReducer, domainsThunk, selectDomains } from './index';

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
        const { store } = setup({ user: { Role: USER_ROLES.FREE_ROLE } as unknown as UserModel });
        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toEqual(getState([], 0));
    });

    it('should fetch domains for a paid user', async () => {
        const { store } = setup({
            user: {
                Role: USER_ROLES.ADMIN_ROLE,
                Subscribed: PRODUCT_BIT.VPN,
            } as unknown as UserModel,
        });
        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toEqual(getState([{ ID: '1' }], 1));
        store.dispatch(
            serverEvent({ Domains: [{ ID: '2', Domain: { ID: '2' } as any, Action: EVENT_ACTIONS.CREATE }] })
        );
        expect(selectDomains(store.getState())).toEqual(getState([{ ID: '1' }, { ID: '2' }], 1));
    });

    it('should clear domains for a downgraded user', async () => {
        const { store } = setup({
            user: {
                Role: USER_ROLES.ADMIN_ROLE,
                Subscribed: PRODUCT_BIT.Mail,
            } as unknown as UserModel,
        });
        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toEqual(getState([{ ID: '1' }], 1));
        store.dispatch(
            serverEvent({ Domains: [{ ID: '2', Domain: { ID: '2' } as any, Action: EVENT_ACTIONS.CREATE }] })
        );
        expect(selectDomains(store.getState())).toEqual(getState([{ ID: '1' }, { ID: '2' }], 1));
        store.dispatch(serverEvent({ User: { Subscribed: 0 } as any }));
        expect(selectDomains(store.getState())).toEqual(getState([], 0));
    });
});
