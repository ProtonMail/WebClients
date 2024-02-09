import { type PassConfig } from '@proton/pass/hooks/usePassConfig';
import { exposeApi } from '@proton/pass/lib/api/api';
import { createApi } from '@proton/pass/lib/api/factory';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { createPassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';

import * as config from '../app/config';

export const PASS_CONFIG = { ...config, APP_NAME: 'proton-pass' } as PassConfig;
exposeAuthStore(createAuthStore(createSecureSessionStorage()));
exposePassCrypto(createPassCrypto({ initCryptoEndpoint: true }));
exposeApi(createApi({ config: PASS_CONFIG }));
