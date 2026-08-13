import { loader, type Loader } from 'vega';

const BLOCKED_RESOURCE_MESSAGE = 'External resource loading is disabled';

const EXTERNAL_URI_PATTERN = /^(?:https?:|\/\/)/i;

function isExternalUri(uri: string): boolean {
    const normalized = uri.trim().replace(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205f\u3000]/g, '');
    return EXTERNAL_URI_PATTERN.test(normalized);
}

/**
 * Loader that rejects network/file fetches while preserving Vega's default URI
 * sanitization (needed for normal embed compilation). Spec sanitization already
 * strips external data URLs before we reach the loader.
 *
 * Image marks load URLs through sanitize(), not load() — both paths must be blocked.
 */
export function createSecureVegaLoader(): Loader {
    const baseLoader = loader({ target: '_self' });

    return {
        ...baseLoader,
        load: async (uri: string) => {
            throw new Error(`${BLOCKED_RESOURCE_MESSAGE}: ${uri}`);
        },
        sanitize: async (uri, options) => {
            if (options?.context === 'image' && isExternalUri(uri)) {
                throw new Error(`${BLOCKED_RESOURCE_MESSAGE}: ${uri}`);
            }

            return baseLoader.sanitize(uri, options);
        },
    };
}
