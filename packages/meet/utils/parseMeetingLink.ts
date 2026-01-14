import { BASE_PASSWORD_LENGTH, MEETING_LINK_ID_LENGTH } from '../constants';

export const parseMeetingLink = (link: string) => {
    const parts = link.split('#');

    if (parts.length !== 2 || !parts[0].includes('id-') || !parts[1].includes('pwd-')) {
        throw new Error('Invalid meeting link');
    }

    const meetingId = parts[0]?.split('/')?.at(-1)?.replace('id-', '');

    const urlPassword = parts[1]?.replace('pwd-', '') ?? '';

    if (meetingId?.length !== MEETING_LINK_ID_LENGTH || urlPassword.length !== BASE_PASSWORD_LENGTH) {
        throw new Error('Invalid meeting link');
    }

    return {
        meetingId,
        urlPassword,
    };
};

export const isValidMeetingLink = (link: string) => {
    try {
        return !!parseMeetingLink(link);
    } catch {
        return false;
    }
};
