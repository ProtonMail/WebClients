import { CacheType } from '@proton/redux-utilities';
import { MINUTE } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { selectNetworkFees } from '../slices';
import { networkFeesThunk } from '../slices/networkFees';
import type { AppStartListening } from '../store';

export const startPollingNetworkFeesListener = (startListening: AppStartListening) => {
    startListening({
        predicate: (action, currentState) => {
            const currentValue = selectNetworkFees(currentState).value;
            return !!currentValue;
        },
        effect: async (action, listenerApi) => {
            listenerApi.unsubscribe();

            try {
                while (true) {
                    await wait(1 * MINUTE);

                    const state = listenerApi.getState();
                    const value = selectNetworkFees(state).value;

                    if (value) {
                        await listenerApi.dispatch(networkFeesThunk({ cache: CacheType.None }));
                    }
                }
            } catch (e) {}
        },
    });
};
