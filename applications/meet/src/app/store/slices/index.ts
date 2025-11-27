import { meetAppStateReducer } from './meetAppStateSlice';
import { meetingsReducer } from './meetings';
import { userSettingsReducer } from './userSettings';

export * from './meetAppStateSlice';
export * from './meetings';
export * from './userSettings';

export const meetReducers = {
    ...meetAppStateReducer,
    ...meetingsReducer,
    ...userSettingsReducer,
};
