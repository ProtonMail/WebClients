import { URL_PASSWORD_PREFIX } from '@proton/meet/constants';
import { isUrlPasswordValid } from '@proton/meet/utils/isUrlPasswordValid';

export const getUrlMeetingPassword = () => {
    const hash = window.location.hash;

    if (!hash) {
        return '';
    }

    if (!isUrlPasswordValid(hash)) {
        throw new Error('Invalid password');
    }

    const password = hash.replace(URL_PASSWORD_PREFIX, '');

    return password;
};
