import { getAppHref } from '../apps/helper';
import { APPS } from '../constants';

export const DOCS_SIGNUP = getAppHref('/docs/signup', APPS.PROTONACCOUNT);
export const DOCS_SIGNIN = getAppHref('/docs', APPS.PROTONACCOUNT);
