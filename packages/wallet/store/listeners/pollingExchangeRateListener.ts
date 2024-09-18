import { CacheType } from '@proton/redux-utilities';
import { MINUTE } from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { wait } from '@proton/shared/lib/helpers/promise';

import { selectExchangeRate } from '../slices';
import { exchangeRateThunk, parseKey } from '../slices/exchangeRate';
import type { AppStartListening } from '../store';

export const startPollingExchangeRateListener = (startListening: AppStartListening) => {
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

                            // Temporary fix to avoid spamming the API
                            // This might create a small discrepency on the 24h change metric, but this will eventually be fixed with the introduction of the bitcoin price graph route
                            if (!timestamp) {
                                await listenerApi.dispatch(
                                    exchangeRateThunk({
                                        cache: CacheType.None,
                                        thunkArg: [fiat, timestamp ? new Date(timestamp) : undefined],
                                    })
                                );
                            }
                        }
                    }
                }
            } catch (e) {}
        },
    });
};
