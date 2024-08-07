import type { Reducer } from 'redux';

import {
    getUserAccessSuccess,
    getUserFeaturesSuccess,
    getUserSettings,
    monitorToggle,
    sentinelToggle,
    userEvent,
} from '@proton/pass/store/actions';
import type {
    BitField,
    MaybeNull,
    PassPlanResponse,
    RequiredNonNull,
    UserMonitorStatusResponse,
} from '@proton/pass/types';
import { EventActions } from '@proton/pass/types';
import type { PassFeature } from '@proton/pass/types/api/features';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { merge, partialMerge } from '@proton/pass/utils/object/merge';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import type { Address, SETTINGS_PASSWORD_MODE, SETTINGS_STATUS, User } from '@proton/shared/lib/interfaces';
import { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';

export type AddressState = { [addressId: string]: Address };
export type FeatureFlagState = Partial<Record<PassFeature, boolean>>;
export type UserSettingsState = {
    Email: { Status: SETTINGS_STATUS };
    Password: { Mode: SETTINGS_PASSWORD_MODE };
    Telemetry: BitField;
    Locale?: string;
    HighSecurity: {
        Eligible: BitField;
        Value: SETTINGS_PROTON_SENTINEL_STATE;
    };
};

export type UserAccessState = {
    plan: MaybeNull<PassPlanResponse>;
    waitingNewUserInvites: number;
    monitor: MaybeNull<UserMonitorStatusResponse>;
};

export type UserState = {
    addresses: AddressState;
    eventId: MaybeNull<string>;
    features: MaybeNull<FeatureFlagState>;
    user: MaybeNull<User>;
    userSettings: MaybeNull<UserSettingsState>;
} & UserAccessState;

export type HydratedUserState = RequiredNonNull<UserState, Exclude<keyof UserState, 'organization'>>;
export type HydratedAccessState = RequiredNonNull<UserAccessState>;

const getInitialState = (): UserState => ({
    addresses: {},
    eventId: null,
    features: null,
    plan: null,
    user: null,
    userSettings: null,
    waitingNewUserInvites: 0,
    monitor: { ProtonAddress: true, Aliases: true },
});

export const INITIAL_HIGHSECURITY_SETTINGS = {
    Eligible: 0,
    Value: SETTINGS_PROTON_SENTINEL_STATE.DISABLED,
};

const reducer: Reducer<UserState> = (state = getInitialState(), action) => {
    if (userEvent.match(action)) {
        if (action.payload.EventID === state.eventId) return state;

        const { Addresses = [], User, EventID, UserSettings } = action.payload;
        const user = User ?? state.user;
        const eventId = EventID ?? null;

        const userSettings = UserSettings
            ? merge(state.userSettings ?? {}, {
                  Email: { Status: UserSettings.Email.Status },
                  Password: { Mode: UserSettings.Password.Mode },
                  Telemetry: UserSettings.Telemetry,
                  Locale: UserSettings.Locale,
                  HighSecurity: UserSettings.HighSecurity,
              })
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

    if (getUserAccessSuccess.match(action)) {
        /* triggered on each popup wakeup: avoid unnecessary re-renders */
        const { plan, waitingNewUserInvites, monitor } = action.payload;

        const didChange =
            waitingNewUserInvites !== state.waitingNewUserInvites ||
            !isDeepEqual(plan, state.plan) ||
            !isDeepEqual(monitor, state.monitor);

        return didChange ? partialMerge(state, { plan, waitingNewUserInvites }) : state;
    }

    if (getUserSettings.success.match(action)) {
        const settings = action.payload;
        return partialMerge(state, {
            userSettings: {
                Email: { Status: settings.Email.Status },
                Password: { Mode: settings.Password.Mode },
                Telemetry: settings.Telemetry,
                Locale: settings.Locale,
                HighSecurity: settings.HighSecurity,
            },
        });
    }

    if (getUserFeaturesSuccess.match(action)) {
        const next: UserState = { ...state, features: null }; /* wipe all features before merge */
        return partialMerge(next, { features: action.payload });
    }

    if (sentinelToggle.success.match(action)) {
        return partialMerge(state, { userSettings: { HighSecurity: { Value: action.payload.value } } });
    }

    if (monitorToggle.success.match(action)) {
        const { ProtonAddress, Aliases } = action.payload;
        return partialMerge(state, { monitor: { ProtonAddress: ProtonAddress ?? false, Aliases: Aliases ?? false } });
    }

    return state;
};

export default reducer;
