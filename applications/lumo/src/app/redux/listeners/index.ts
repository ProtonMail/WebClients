import { createListenerMiddleware } from '@reduxjs/toolkit';

import { startAccountSessionsListener, startPersistListener } from '@proton/account';
import { getPersistedState } from '@proton/redux-shared-store/persist';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';
import { sharedPersistReducer } from '@proton/redux-shared-store/sharedReducers';
import { selectPersistModel } from '@proton/redux-utilities';

import type { AppStartListening, LumoListener, LumoState } from '../store';
import type { LumoThunkArguments } from '../thunk';
import { startPersonalizationListeners } from './personalizationListener';
import { startLumoUserSettingsListeners } from './lumoUserSettingsListener';

const persistReducer: Partial<{ [key in keyof LumoState]: any }> = {
    ...sharedPersistReducer,
    sessions: selectPersistModel,
    contextFilters: selectPersistModel, // Persist context filters so they survive page reloads
    personalization: selectPersistModel, // Persist personalization settings
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
    startLumoUserSettingsListeners(startListening);
};

export const createLumoListenerMiddleware = ({ extra }: { extra: LumoThunkArguments }): LumoListener => {
    const listener = createListenerMiddleware({ extra }) as LumoListener;
    return listener;
};
