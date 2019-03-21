import { createContext } from 'react';
import { getSettings } from 'proton-shared/lib/api/settings';
import { useApi } from 'react-components';

import createProvider from './helpers/createProvider';
import createModelHook from './helpers/createModelHook';
import createUseModelHook from './helpers/createUseModelHook';

const useAsyncFn = () => {
    const api = useApi();
    return () => {
        return api(getSettings()).then(({ UserSettings }) => UserSettings);
    };
};

const providerValue = createModelHook({
    useAsyncFn
});
export const UserSettingsContext = createContext();
export const UserSettingsProvider = createProvider(UserSettingsContext, providerValue);
export const useUserSettings = createUseModelHook(UserSettingsContext);
