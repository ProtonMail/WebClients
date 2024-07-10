import { getCookie } from '@proton/shared/lib/helpers/cookies';

export const USE_COOKIES = getCookie('ps_legacy') === undefined;
