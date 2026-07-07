import { loader, type Loader } from 'vega';

const BLOCKED_RESOURCE_MESSAGE = 'External resource loading is disabled';

/**
 * Loader that rejects network/file fetches while preserving Vega's default URI
 * sanitization (needed for normal embed compilation). Spec sanitization already
 * strips external data URLs before we reach the loader.
 */
export function createSecureVegaLoader(): Loader {
    const baseLoader = loader({ target: '_self' });

    return {
        ...baseLoader,
        load: async (uri: string) => {
            throw new Error(`${BLOCKED_RESOURCE_MESSAGE}: ${uri}`);
        },
    };
}
