import { createContext } from 'react';
import { getMailSettings } from 'proton-shared/lib/api/mailSettings';
import { useApi } from 'react-components';

import createProvider from './helpers/createProvider';
import createModelHook from './helpers/createModelHook';
import createUseModelHook from './helpers/createUseModelHook';

const useAsyncFn = () => {
    const api = useApi();
    return () => {
        return api(getMailSettings()).then(({ MailSettings }) => MailSettings);
    };
};

const providerValue = createModelHook({
    useAsyncFn
});
export const MailSettingsContext = createContext();
export const MailSettingsProvider = createProvider(MailSettingsContext, providerValue);
export const useMailSettings = createUseModelHook(MailSettingsContext);
