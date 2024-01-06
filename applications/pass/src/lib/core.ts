import { type PassConfig } from '@proton/pass/hooks/usePassConfig';
import { exposeApi } from '@proton/pass/lib/api/api';
import { createApi } from '@proton/pass/lib/api/factory';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { createPassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';
import { APPS } from '@proton/shared/lib/constants';

import * as config from '../app/config';

export const PASS_CONFIG = { ...config, SSO_URL: getAppHref('/', APPS.PROTONACCOUNT) } as PassConfig;
exposeAuthStore(createAuthStore(createSecureSessionStorage()));
exposePassCrypto(createPassCrypto({ initCryptoEndpoint: true }));
exposeApi(createApi({ config }));
