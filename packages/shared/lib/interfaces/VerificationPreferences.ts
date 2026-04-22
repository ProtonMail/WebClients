import type { PublicKeyReference } from '@protontech/crypto';

import type { KeyTransparencyVerificationResult } from './KeyTransparency';

export interface VerificationPreferences {
    isOwnAddress: boolean;
    verifyingKeys: PublicKeyReference[];
    apiKeys: PublicKeyReference[];
    pinnedKeys: PublicKeyReference[];
    compromisedKeysFingerprints?: Set<string>;
    pinnedKeysFingerprints?: Set<string>;
    ktVerificationResult?: KeyTransparencyVerificationResult;
    pinnedKeysVerified?: boolean;
    apiKeysErrors?: string[];
}
