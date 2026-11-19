import { MEETING_LINK_ID_LENGTH } from '@proton/shared/lib/meet/parseMeetingLink';
import { DEFAULT_CHARSET } from '@proton/utils/getRandomString';

import { URL_ID_PREFIX } from '../constants';

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
