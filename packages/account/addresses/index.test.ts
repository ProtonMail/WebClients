import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';

import { serverEvent } from '../eventLoop';
import { addressesReducer, addressesThunk, selectAddresses } from './index';

describe('addresses', () => {
    it('should update addresses', async () => {
        const extraThunkArguments = {
            api: async () => {
                return { Addresses: [{ ID: '1' }] };
            },
        } as unknown as ProtonThunkArguments;
        const { store } = getTestStore({ reducer: { ...addressesReducer }, extraThunkArguments });
        await store.dispatch(addressesThunk());
        expect(selectAddresses(store.getState())).toMatchObject({ value: [{ ID: '1' }] });
        store.dispatch(
            serverEvent({ Addresses: [{ ID: '2', Address: { ID: '2' } as any, Action: EVENT_ACTIONS.CREATE }] })
        );
        expect(selectAddresses(store.getState())).toMatchObject({ value: [{ ID: '1' }, { ID: '2' }] });
    });
});
