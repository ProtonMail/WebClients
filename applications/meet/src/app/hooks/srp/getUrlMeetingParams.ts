import { URL_ID_PREFIX, URL_PASSWORD_PREFIX } from '@proton/meet/constants';
import { isUrlPasswordValid } from '@proton/meet/utils/isUrlPasswordValid';
import { MEETING_LINK_ID_LENGTH } from '@proton/shared/lib/meet/parseMeetingLink';
import { DEFAULT_CHARSET } from '@proton/utils/getRandomString';

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

export const getUrlMeetingLinkName = () => {
    const pathname = window.location.pathname;

    const potentialId = pathname.split('/').at(-1);

    const meetingLinkName = potentialId?.includes(URL_ID_PREFIX) ? potentialId.replace(URL_ID_PREFIX, '') : '';

    if (!meetingLinkName) {
        return '';
    }

    if (
        meetingLinkName.length !== MEETING_LINK_ID_LENGTH ||
        meetingLinkName.split('').some((char) => !DEFAULT_CHARSET.includes(char))
    ) {
        throw new Error('Invalid meeting id');
    }

    return meetingLinkName;
};
