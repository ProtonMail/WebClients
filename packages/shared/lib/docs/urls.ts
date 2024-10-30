import { PLANS } from '@proton/payments/index';

import { getAppHref } from '../apps/helper';
import { APPS } from '../constants';

export const DOCS_SIGNUP = getAppHref('/docs/signup', APPS.PROTONACCOUNT);
export const DOCS_SIGNUP_FREE = getAppHref(`/docs/signup?plan=${PLANS.FREE}`, APPS.PROTONACCOUNT);
export const DOCS_SIGNIN = getAppHref('/docs', APPS.PROTONACCOUNT);
