import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';
import { CacheType } from '@proton/redux-utilities';
import { MINUTE } from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { wait } from '@proton/shared/lib/helpers/promise';

import { selectExchangeRate } from './slices';
import { exchangeRateThunk, parseKey } from './slices/exchangeRate';
import type { AppStartListening } from './store';

const startPollingExchangeRate = (startListening: AppStartListening) => {
    startListening({
        predicate: (action, previousState, currentState) => {
            const previousValue = selectExchangeRate(previousState).value;
            const currentValue = selectExchangeRate(currentState).value;

            return Boolean(
                currentValue && previousValue && isDeepEqual(Object.keys(currentValue), Object.keys(previousValue))
            );
        },
        effect: async (action, listenerApi) => {
            listenerApi.unsubscribe();

            try {
                while (true) {
                    await wait(1 * MINUTE);

                    const state = listenerApi.getState();
                    const value = selectExchangeRate(state).value;

                    if (value) {
                        for (const key of Object.keys(value)) {
                            const { fiat, timestamp } = parseKey(key);

                            await listenerApi.dispatch(
                                exchangeRateThunk({
                                    cache: CacheType.None,
                                    thunkArg: [fiat, timestamp ? new Date(timestamp) : undefined],
                                })
                            );
                        }
                    }
                }
            } catch (e) {}
        },
    });
};

export const start = (startListening: AppStartListening) => {
    startSharedListening(startListening);
    startPollingExchangeRate(startListening);
};
