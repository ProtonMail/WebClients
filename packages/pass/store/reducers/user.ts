import type { Reducer } from 'redux';

import {
    bootSuccess,
    getUserFeaturesSuccess,
    getUserPlanSuccess,
    setUserSettings,
    userEvent,
} from '@proton/pass/store/actions';
import type { MaybeNull, PassPlanResponse } from '@proton/pass/types';
import { EventActions } from '@proton/pass/types';
import type { PassFeature } from '@proton/pass/types/api/features';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { fullMerge, merge, partialMerge } from '@proton/pass/utils/object/merge';
import type { Address, SETTINGS_STATUS, User } from '@proton/shared/lib/interfaces';

export type AddressState = { [addressId: string]: Address };
export type FeatureFlagState = Partial<Record<PassFeature, boolean>>;
export type UserPlanState = PassPlanResponse;
export type UserSettingsState = { Email?: { Status: SETTINGS_STATUS }; Telemetry?: 1 | 0 };

export type UserState = {
    addresses: AddressState;
    eventId: MaybeNull<string>;
    features: MaybeNull<FeatureFlagState>;
    plan: MaybeNull<UserPlanState>;
    user: MaybeNull<User>;
    userSettings: MaybeNull<UserSettingsState>;
};

const initialState: UserState = {
    addresses: {},
    eventId: null,
    features: null,
    plan: null,
    user: null,
    userSettings: null,
};

const reducer: Reducer<UserState> = (state = initialState, action) => {
    if (bootSuccess.match(action)) {
        return fullMerge(state, {
            addresses: action.payload.addresses,
            eventId: action.payload.eventId,
            features: action.payload.features,
            plan: action.payload.plan,
            user: action.payload.user,
            userSettings: action.payload.userSettings,
        });
    }

    if (userEvent.match(action)) {
        const { Addresses = [], User, EventID, UserSettings } = action.payload;

        const user = User ?? state.user;

        const eventId = EventID ?? null;

        const userSettings = UserSettings
            ? { Email: { Status: UserSettings.Email.Status }, Telemetry: UserSettings.Telemetry }
            : state.userSettings;

        const addresses = Addresses.reduce(
            (acc, { Action, ID, Address }) =>
                Action === EventActions.DELETE ? objectDelete(acc, ID) : merge(acc, { [ID]: Address }),
            state.addresses
        );

        return {
            ...state,
            user,
            eventId,
            addresses,
            userSettings,
        };
    }

    if (setUserSettings.match(action)) return partialMerge(state, { userSettings: action.payload });

    if (getUserPlanSuccess.match(action)) return partialMerge(state, { plan: action.payload });

    if (getUserFeaturesSuccess.match(action)) {
        state.features = null; /* wipe all features before merge */
        return partialMerge(state, { features: action.payload });
    }

    return state;
};

export default reducer;
