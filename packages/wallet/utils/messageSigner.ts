import { WasmMessageSigner } from '@proton/andromeda';

type MessageSignerCache = { messageSigner?: WasmMessageSigner };

const messageSignerCache: MessageSignerCache = {};

// Creating WasmMessageSigner object is expensive, so we have a local cache
const getCachedWasmMessageSigner = (cache: MessageSignerCache) => {
    if (!cache.messageSigner) {
        cache.messageSigner = new WasmMessageSigner();
    }

    return cache.messageSigner;
};

/**
 * A cached WasmMessageSigner object
 */
export const getWasmMessageSigner = () => getCachedWasmMessageSigner(messageSignerCache);
