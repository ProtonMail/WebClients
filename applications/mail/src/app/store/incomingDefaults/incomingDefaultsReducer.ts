import type { PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { IncomingDefault } from '@proton/shared/lib/interfaces';

import type { IncomingDefaultEvent } from '../../models/event';
import type { IncomingDefaultsState } from './incomingDefaultsTypes';

export const loadFulfilled = (
    state: Draft<IncomingDefaultsState>,
    action: PayloadAction<Pick<IncomingDefaultsState, 'list'>>
) => {
    state.list = action.payload.list;
    state.status = 'loaded';
};

export const loadRejected = (state: Draft<IncomingDefaultsState>) => {
    state.list = [];
    state.status = 'rejected';
};

export const loadPending = (state: Draft<IncomingDefaultsState>) => {
    state.list = [];
    state.status = 'pending';
};

export const event = (state: Draft<IncomingDefaultsState>, action: PayloadAction<IncomingDefaultEvent>) => {
    action.payload.forEach((itemUpdate) => {
        const { Action, ID } = itemUpdate;

        if (Action === EVENT_ACTIONS.DELETE) {
            state.list = state.list.filter((item) => item.ID !== ID);
        }
        if (Action === EVENT_ACTIONS.UPDATE) {
            const { IncomingDefault } = itemUpdate;
            const itemIndex = state.list.findIndex((item) => item.ID === ID);

            if (itemIndex !== -1) {
                state.list[itemIndex] = { ...state.list[itemIndex], ...IncomingDefault };
            }
        }
        if (Action === EVENT_ACTIONS.CREATE) {
            const { IncomingDefault } = itemUpdate;
            const itemIndex = state.list.findIndex((item) => item.ID === ID);

            if (itemIndex === -1) {
                state.list.push({ ...IncomingDefault });
                return;
            }

            state.list[itemIndex] = { ...IncomingDefault };
        }
    });
};

export const blockAddressesFullfilled = (
    state: Draft<IncomingDefaultsState>,
    action: PayloadAction<IncomingDefault[]>
) => {
    action.payload.forEach((incomingDefault) => {
        const itemIndex = state.list.findIndex((item) => item.ID === incomingDefault.ID);

        if (itemIndex !== -1) {
            state.list[itemIndex] = incomingDefault;
        } else {
            state.list.push(incomingDefault);
        }
    });
};

export const removeFullfilled = (state: Draft<IncomingDefaultsState>, action: PayloadAction<{ ID: string }[]>) => {
    const removedIDs = action.payload.map(({ ID }) => ID);

    state.list = state.list.filter((item) => !removedIDs.includes(item.ID));
};
