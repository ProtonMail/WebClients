import { createSelector } from '@reduxjs/toolkit';

import { baseUseSelector } from '@proton/react-redux-store';
import type { KeyReactivationRequest } from '@proton/shared/lib/keys';
import { getAllKeysReactivationRequests } from '@proton/shared/lib/keys/getInactiveKeys';

import { type AddressesState, selectAddresses } from '../addresses';
import { type UserState, selectUser } from '../user';
import { type InactiveKeysState, selectInactiveKeys } from './index';

type Result = KeyReactivationRequest[];

const selector = createSelector(
    [
        (state: InactiveKeysState) => selectInactiveKeys(state),
        (state: UserState) => selectUser(state).value,
        (state: AddressesState) => selectAddresses(state).value,
    ],
    (inactiveKeys, user, addresses): Result => {
        return getAllKeysReactivationRequests({ addresses, user, inactiveKeys });
    }
);

export const useInactiveKeys = () => {
    return baseUseSelector<InactiveKeysState & UserState & AddressesState, Result>(selector);
};
