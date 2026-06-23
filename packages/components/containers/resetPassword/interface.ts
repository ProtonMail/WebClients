import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import type { Api, DecryptedKey } from '@proton/shared/lib/interfaces';

export interface MnemonicData {
    api: Api;
    decryptedUserKeys: DecryptedKey[];
    authResponse: AuthResponse;
}
