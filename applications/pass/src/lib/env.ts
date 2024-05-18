import * as config from 'proton-pass-web/app/config';

import { type PassConfig } from '@proton/pass/hooks/usePassConfig';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

export const PASS_CONFIG = { ...config, SSO_URL: getAppHref('/', APPS.PROTONACCOUNT) } as PassConfig;
