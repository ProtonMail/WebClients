import { meetingsReducer } from './meetings';
import { userSettingsReducer } from './userSettings';

export * from './meetings';
export * from './userSettings';

export const meetReducers = {
    ...meetingsReducer,
    ...userSettingsReducer,
};
