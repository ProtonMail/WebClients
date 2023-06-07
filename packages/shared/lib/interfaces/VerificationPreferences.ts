import { PublicKeyReference } from '@proton/crypto';

import { KT_VERIFICATION_STATUS } from './EncryptionPreferences';

export interface VerificationPreferences {
    isOwnAddress: boolean;
    verifyingKeys: PublicKeyReference[];
    apiKeys: PublicKeyReference[];
    pinnedKeys: PublicKeyReference[];
    compromisedKeysFingerprints?: Set<string>;
    pinnedKeysFingerprints?: Set<string>;
    ktVerificationStatus?: KT_VERIFICATION_STATUS;
    pinnedKeysVerified?: boolean;
}
