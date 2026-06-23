import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import type { CryptoWorkerOptions } from '@proton/shared/lib/helpers/setupCryptoWorker';
import clamp from '@proton/utils/clamp';

export const getCryptoWorkerOptions = (
    appName: APP_NAMES,
    openpgpConfigOptions: NonNullable<CryptoWorkerOptions['openpgpConfigOptions']>
): CryptoWorkerOptions => {
    const defaultOptions = { openpgpConfigOptions, awaitOnFirstUse: true };
    // The account and vpn app typically requires less crypto workers than others, mainly for SRP and key management.
    // This is to avoid loading too many workers to prevent load issues.
    if (appName === APPS.PROTONACCOUNT || appName === APPS.PROTONVPN_SETTINGS) {
        return {
            ...defaultOptions,
            poolSize: clamp(navigator.hardwareConcurrency, 1, 2),
        };
    }
    // Reduce the number of workers on Firefox to limit NSS lock contention.
    // With the default pool size (hardwareConcurrency), concurrent SubtleCrypto
    // calls serialize on an internal NSS mutex, slowing down node decryption.
    if (appName === APPS.PROTONDRIVE && isFirefox()) {
        return {
            ...defaultOptions,
            poolSize: clamp(Math.floor(navigator.hardwareConcurrency / 2), 2, 6),
        };
    }

    return defaultOptions;
};
