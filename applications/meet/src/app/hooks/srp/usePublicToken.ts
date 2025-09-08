import { MEETING_LINK_ID_LENGTH, URL_ID_PREFIX, URL_PASSWORD_PREFIX } from '@proton/meet/constants';
import { isUrlPasswordValid } from '@proton/meet/utils/isUrlPasswordValid';
import { DEFAULT_CHARSET } from '@proton/utils/getRandomString';

export const getUrlPassword = () => {
    const hash = window.location.hash;

    if (!isUrlPasswordValid(hash)) {
        throw new Error('Invalid password');
    }

    const password = hash.replace(URL_PASSWORD_PREFIX, '');

    return password;
};

export const getPublicToken = () => {
    const pathname = window.location.pathname;

    const potentialId = pathname.split('/').at(-1);

    const token = potentialId?.includes(URL_ID_PREFIX) ? (potentialId?.replace(URL_ID_PREFIX, '') as string) : '';

    if (token.length !== MEETING_LINK_ID_LENGTH || token.split('').some((char) => !DEFAULT_CHARSET.includes(char))) {
        throw new Error('Invalid meeting id');
    }

    return token;
};
