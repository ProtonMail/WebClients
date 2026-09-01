import { BASE_PASSWORD_LENGTH } from '@proton/shared/lib/meet/parseMeetingLink';
import { DEFAULT_CHARSET } from '@proton/utils/getRandomString';

import { URL_PASSWORD_PREFIX } from '../constants';

export const isUrlPasswordValid = (hash: string) => {
    if (!hash || typeof hash !== 'string' || !hash.startsWith(URL_PASSWORD_PREFIX)) {
        return false;
    }

    const password = hash.replace(URL_PASSWORD_PREFIX, '');
    return (
        password.length === BASE_PASSWORD_LENGTH && password.split('').every((char) => DEFAULT_CHARSET.includes(char))
    );
};
