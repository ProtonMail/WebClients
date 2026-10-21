import { AuthMode } from '../../types/api/api';

export const AUTH_MODE =
    !(typeof EXTENSION_BUILD !== 'undefined' && EXTENSION_BUILD) && !localStorage.getItem('ps_legacy')
        ? AuthMode.COOKIE
        : AuthMode.TOKEN;
