import {createListenerMiddleware} from '@reduxjs/toolkit';

import {startAccountSessionsListener, startPersistListener} from '@proton/account';
import {getPersistedState} from '@proton/redux-shared-store/persist';
import {startSharedListening} from '@proton/redux-shared-store/sharedListeners';
import {sharedPersistReducer} from '@proton/redux-shared-store/sharedReducers';
import {selectPersistModel} from '@proton/redux-utilities';

import type {AppStartListening, LumoListener, LumoState} from '../store';
import type {LumoThunkArguments} from '../thunk';
import {startFeatureFlagsListeners} from './featureFlagsListener';
import {startLumoUserSettingsListeners} from './lumoUserSettingsListener';
import {startPersonalizationListeners} from './personalizationListener';

const persistReducer: Partial<{ [key in keyof LumoState]: any }> = {
    ...sharedPersistReducer,
    sessions: selectPersistModel,
    contextFilters: selectPersistModel, // Persist context filters so they survive page reloads
    personalization: selectPersistModel, // Persist personalization settings
    featureFlags: selectPersistModel, // Persist feature flags
    lumoUserSettings: selectPersistModel, // Persist Lumo user settings
};

const getLumoPersistedState = (state: LumoState) => {
    return getPersistedState(state, persistReducer);
};

export const start = (startListening: AppStartListening) => {
    startSharedListening(startListening);
    startPersistListener(startListening, getLumoPersistedState);
    startAccountSessionsListener(startListening);
    startPersonalizationListeners(startListening);
    startFeatureFlagsListeners(startListening);
    startLumoUserSettingsListeners(startListening);
};

export const createLumoListenerMiddleware = ({ extra }: { extra: LumoThunkArguments }): LumoListener => {
    return createListenerMiddleware({extra}) as LumoListener;
};
