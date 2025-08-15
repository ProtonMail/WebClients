import { type PayloadAction, type ThunkAction, type UnknownAction, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType, createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { getAddress as getAddressConfig } from '@proton/shared/lib/api/addresses';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { type UpdateCollectionV6, updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Address, Api } from '@proton/shared/lib/interfaces';
import { sortAddresses } from '@proton/shared/lib/mail/addresses';
import { removeById } from '@proton/utils/removeById';
import { upsertById } from '@proton/utils/upsertById';

import { serverEvent } from '../eventLoop';
import { initEvent } from '../init';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';

const name = 'addresses' as const;

export interface AddressesState {
    [name]: ModelState<Address[]>;
}

type SliceState = AddressesState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectAddresses = (state: AddressesState) => state[name];

const modelThunk = createAsyncModelThunk<Model, AddressesState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return getAllAddresses(extraArgument.api).then(sortAddresses);
    },
    previous: previousSelector(selectAddresses),
});

const initialState = getInitialModelState<Model>();

const slice = createSlice({
    name,
    initialState,
    reducers: {
        eventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<Address>>) => {
            if (state.value) {
                state.value = sortAddresses(updateCollectionV6(state.value, action.payload));
            }
        },
        deleteAddress: (state, action: PayloadAction<{ ID: string }>) => {
            if (!state.value) {
                return;
            }
            state.value = sortAddresses(removeById(state.value, action.payload, 'ID'));
        },
        upsertAddress: (state, action: PayloadAction<Address>) => {
            if (!state.value) {
                return;
            }
            state.value = sortAddresses(upsertById(state.value, action.payload, 'ID'));
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder
            .addCase(initEvent, (state, action) => {
                if (action.payload.Addresses) {
                    state.value = action.payload.Addresses;
                }
            })
            .addCase(serverEvent, (state, action) => {
                if (state.value && action.payload.Addresses) {
                    state.value = sortAddresses(
                        updateCollection({
                            model: state.value,
                            events: action.payload.Addresses,
                            itemKey: 'Address',
                        })
                    );
                }
            });
    },
});

export const addressesReducer = { [name]: slice.reducer };
export const addressesThunk = modelThunk.thunk;
export const addressActions = slice.actions;

export const getAddress = async (api: Api, ID: string) => {
    const { Address } = await api<{ Address: Address }>(getAddressConfig(ID));
    return Address;
};

export const addressThunk = ({
    address: oldAddress,
}: {
    address: Address & { ID: string };
    cache: CacheType;
}): ThunkAction<Promise<Address>, AddressesState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const address = await getAddress(extra.api, oldAddress.ID);
        dispatch(addressActions.upsertAddress(address));
        return address;
    };
};

export const addressesEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: CoreEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, AddressesState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await updateCollectionAsyncV6({
            events: event.Addresses,
            get: (ID) => getAddress(api, ID),
            refetch: () => dispatch(addressesThunk({ cache: CacheType.None })),
            update: (result) => dispatch(addressActions.eventLoopV6(result)),
        });
    };
};
