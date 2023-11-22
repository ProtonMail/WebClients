import type { Reducer } from 'redux';

import { getUserAccessSuccess, getUserFeaturesSuccess, userEvent } from '@proton/pass/store/actions';
import type { MaybeNull, PassPlanResponse, RequiredNonNull } from '@proton/pass/types';
import { EventActions } from '@proton/pass/types';
import type { PassFeature } from '@proton/pass/types/api/features';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { merge, partialMerge } from '@proton/pass/utils/object/merge';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import type { Address, SETTINGS_STATUS, User } from '@proton/shared/lib/interfaces';

export type AddressState = { [addressId: string]: Address };
export type FeatureFlagState = Partial<Record<PassFeature, boolean>>;
export type UserSettingsState = { Email?: { Status: SETTINGS_STATUS }; Telemetry?: 1 | 0 };

export type UserAccessState = {
    plan: MaybeNull<PassPlanResponse>;
    waitingNewUserInvites: number;
};

export type UserState = {
    addresses: AddressState;
    eventId: MaybeNull<string>;
    features: MaybeNull<FeatureFlagState>;
    user: MaybeNull<User>;
    userSettings: MaybeNull<UserSettingsState>;
} & UserAccessState;

export type SafeUserState = RequiredNonNull<UserState>;
export type SafeUserAccessState = RequiredNonNull<UserAccessState>;

const initialState: UserState = {
    addresses: {},
    eventId: null,
    features: null,
    plan: null,
    user: null,
    userSettings: null,
    waitingNewUserInvites: 0,
};

const reducer: Reducer<UserState> = (state = initialState, action) => {
    if (userEvent.match(action)) {
        if (action.payload.EventID === state.eventId) return state;

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

    /* triggered on each popup wakeup: avoid unnecessary re-renders */
    if (getUserAccessSuccess.match(action)) {
        const { plan, waitingNewUserInvites } = action.payload;
        const didChange = waitingNewUserInvites !== state.waitingNewUserInvites || !isDeepEqual(plan, state.plan);

        return didChange
            ? partialMerge(state, {
                  plan: action.payload.plan,
                  waitingNewUserInvites: action.payload.waitingNewUserInvites,
              })
            : state;
    }

    if (getUserFeaturesSuccess.match(action)) {
        state.features = null; /* wipe all features before merge */
        return partialMerge(state, { features: action.payload });
    }

    return state;
};

export default reducer;
