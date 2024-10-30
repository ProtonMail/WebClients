import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import type { AppStartListening } from '../store';
import { startPollingExchangeRateListener } from './pollingExchangeRateListener';
import { startPollingNetworkFeesListener } from './pollingNetworkFees';
import { startWalletEventListener } from './walletEventListener';

export const start = (startListening: AppStartListening) => {
    startSharedListening(startListening);

    startPollingExchangeRateListener(startListening);
    startPollingNetworkFeesListener(startListening);

    startWalletEventListener(startListening);
};
