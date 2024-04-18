import * as config from 'proton-pass-web/app/config';

import { API_CONCURRENCY_TRESHOLD } from '@proton/pass/constants';
import { type PassConfig } from '@proton/pass/hooks/usePassConfig';
import { exposeApi } from '@proton/pass/lib/api/api';
import { createApi } from '@proton/pass/lib/api/factory';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { createPassCoreService } from '@proton/pass/lib/core/service';
import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { createPassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';
import { APPS } from '@proton/shared/lib/constants';

export const PASS_CONFIG = { ...config, SSO_URL: getAppHref('/', APPS.PROTONACCOUNT) } as PassConfig;

exposeAuthStore(createAuthStore(createSecureSessionStorage()));
exposePassCrypto(createPassCrypto());
exposeApi(createApi({ config, threshold: API_CONCURRENCY_TRESHOLD }));

export const core = createPassCoreService();
