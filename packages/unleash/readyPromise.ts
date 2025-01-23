import type { UnleashClient } from '@unleash/proxy-client-react';

export const getUnleashReadyPromise = async (unleashClient: UnleashClient, maxWaitMs = 1000) => {
    if (unleashClient.isReady()) {
        return;
    }
    const error = unleashClient.getError();
    if (error) {
        throw error;
    }
    return new Promise<void>((resolve, reject) => {
        const timeoutHandler = setTimeout(
            () => reject(new Error('Failed to fetch unleash flags before timeout')),
            maxWaitMs
        );
        const cancelTimeout = () => clearTimeout(timeoutHandler);
        unleashClient.once('ready', () => {
            cancelTimeout();
            resolve();
        });
        unleashClient.once('error', (error: any) => {
            cancelTimeout();
            reject(error);
        });
    });
};
