import { deleteCookie, getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import noop from '@proton/utils/noop';

/** no-op on extension as it doesn't use cookies */
export const setPassCookie = EXTENSION_BUILD ? noop : setCookie;
export const getPassCookie = EXTENSION_BUILD ? noop : getCookie;
export const deletePassCookie = EXTENSION_BUILD ? noop : deleteCookie;
