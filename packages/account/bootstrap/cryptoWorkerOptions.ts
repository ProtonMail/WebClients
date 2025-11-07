import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { CryptoWorkerOptions } from '@proton/shared/lib/helpers/setupCryptoWorker';
import clamp from '@proton/utils/clamp';

export const getCryptoWorkerOptions = (
    appName: APP_NAMES,
    openpgpConfigOptions: NonNullable<CryptoWorkerOptions['openpgpConfigOptions']>
): CryptoWorkerOptions => {
    // The account and vpn app typically requires less crypto workers than others, mainly for SRP and key management.
    // This is to avoid loading too many workers to prevent load issues.
    if (appName === APPS.PROTONACCOUNT || appName === APPS.PROTONVPN_SETTINGS) {
        return {
            awaitOnFirstUse: true,
            poolSize: clamp(navigator.hardwareConcurrency, 1, 2),
            openpgpConfigOptions,
        };
    }

    return { openpgpConfigOptions, awaitOnFirstUse: true };
};
