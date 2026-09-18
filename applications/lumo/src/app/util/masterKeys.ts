import { base64ToMasterKey } from '../crypto';
import type { MasterKeyContext } from '../serialization';
import type { Base64, MasterKeysBundle } from '../types';

/**
 * Keep the server's refreshed primary selection while retaining keys recovered earlier through
 * address-key fallback. A user-key-only refresh cannot recover those legacy keys by itself.
 */
export function mergeRefreshedMasterKeysBundle(
    recoveredBundle: MasterKeysBundle,
    refreshedBundle: MasterKeysBundle
): MasterKeysBundle {
    return {
        ...refreshedBundle,
        masterKeys: {
            ...recoveredBundle.masterKeys,
            ...refreshedBundle.masterKeys,
        },
    };
}

/** Master key envelopes are keyed by unique server IDs; exclude only the current primary. */
export function getLegacyMasterKeyBase64(bundle: MasterKeysBundle): Base64[] {
    return Object.entries(bundle.masterKeys)
        .filter(([id]) => id !== bundle.primaryMasterKeyId)
        .map(([, keyBase64]) => keyBase64);
}

export async function buildMasterKeyContext(bundle: MasterKeysBundle): Promise<MasterKeyContext> {
    const primary = await base64ToMasterKey(bundle.primaryMasterKey);
    const legacy = await Promise.all(getLegacyMasterKeyBase64(bundle).map((keyBase64) => base64ToMasterKey(keyBase64)));
    return { primary, legacy };
}
