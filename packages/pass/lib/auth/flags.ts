import { AuthMode } from '@proton/pass/types';

export const AUTH_MODE =
    !(typeof EXTENSION_BUILD !== 'undefined' && EXTENSION_BUILD) && !localStorage.getItem('ps_legacy')
        ? AuthMode.COOKIE
        : AuthMode.TOKEN;
