import { AuthMode } from '@proton/pass/types';
import { getCookie } from '@proton/shared/lib/helpers/cookies';

export const AUTH_MODE = !EXTENSION_BUILD && getCookie('ps_legacy') === undefined ? AuthMode.COOKIE : AuthMode.TOKEN;
