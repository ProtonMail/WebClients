import { URL_ID_PREFIX, URL_PASSWORD_PREFIX } from '../constants';

export const getMeetingLink = (meetingId: string, password: string) => {
    return `/join/${URL_ID_PREFIX}${meetingId}${URL_PASSWORD_PREFIX}${password}`;
};
