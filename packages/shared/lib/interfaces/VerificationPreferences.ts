import { PublicKeyReference } from '@proton/crypto';

import { KeyTransparencyVerificationResult } from './KeyTransparency';

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
