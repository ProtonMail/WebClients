import { type PayloadAction, type ThunkAction, type UnknownAction, createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType, createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import type { MailEventV6Response } from '@proton/shared/lib/api/events';
import { queryAllIncomingForwardings, queryIncomingForwarding } from '@proton/shared/lib/api/forwardings';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { type UpdateCollectionV6, updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Api, IncomingAddressForwarding } from '@proton/shared/lib/interfaces';
import { removeById } from '@proton/utils/removeById';
import { upsertById } from '@proton/utils/upsertById';

const name = 'incomingAddressForwarding' as const;

export interface IncomingAddressForwardingState {
    [name]: ModelState<IncomingAddressForwarding[]>;
}

type SliceState = IncomingAddressForwardingState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const getIncomingAddressForwarding = async (api: Api, id: string) => {
    const { IncomingAddressForwarding } = await api<{
        IncomingAddressForwarding: IncomingAddressForwarding;
    }>(queryIncomingForwarding(id));

    return IncomingAddressForwarding;
};

export const selectIncomingForwarding = (state: IncomingAddressForwardingState) => state[name];

const modelThunk = createAsyncModelThunk<Model, IncomingAddressForwardingState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return queryAllIncomingForwardings(extraArgument.api);
    },
    previous: previousSelector(selectIncomingForwarding),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        eventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<IncomingAddressForwarding>>) => {
            if (state.value) {
                state.value = updateCollectionV6(state.value, action.payload);
            }
        },
        upsertForwarding: (state, action: PayloadAction<IncomingAddressForwarding>) => {
            if (!state.value) {
                return;
            }
            state.value = upsertById(state.value, action.payload, 'ID');
        },
        deleteForwarding: (state, action: PayloadAction<IncomingAddressForwarding>) => {
            if (!state.value) {
                return;
            }
            state.value = removeById(state.value, action.payload, 'ID');
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.IncomingAddressForwardings) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.IncomingAddressForwardings,
                    itemKey: 'IncomingAddressForwarding',
                });
            }
        });
    },
});

export const incomingAddressForwardingsReducer = { [name]: slice.reducer };
export const incomingAddressForwardingsThunk = modelThunk.thunk;
export const incomingAddressForwardingsActions = slice.actions;

export const incomingForwardingEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: MailEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, IncomingAddressForwardingState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await updateCollectionAsyncV6({
            events: event.IncomingForwardings,
            get: (ID) => getIncomingAddressForwarding(api, ID),
            refetch: () => dispatch(incomingAddressForwardingsThunk({ cache: CacheType.None })),
            update: (result) => dispatch(incomingAddressForwardingsActions.eventLoopV6(result)),
        });
    };
};
