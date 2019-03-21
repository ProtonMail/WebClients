import { createContext } from 'react';
import { getSubscription } from 'proton-shared/lib/api/payments';
import { useApi } from 'react-components';

import createProvider from './helpers/createProvider';
import createModelHook from './helpers/createModelHook';
import createUseModelHook from './helpers/createUseModelHook';

const useAsyncFn = () => {
    const api = useApi();
    return () => {
        return api(getSubscription()).then(({ Subscription }) => Subscription);
    };
};

const providerValue = createModelHook({
    useAsyncFn
});
export const SubscriptionContext = createContext();
export const SubscriptionProvider = createProvider(SubscriptionContext, providerValue);
export const useSubscription = createUseModelHook(SubscriptionContext);
