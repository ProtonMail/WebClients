import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';

const ROTATE_PERSONAL_MEETING_DISABLE_KEY = 'proton-meet-rotate-personal-meeting-button';

export const getRotatePersonalMeetingDisabledUntil = (): number | undefined => {
    const pathLocalID = getLocalIDFromPathname(location.pathname);
    const storedData = localStorage.getItem(ROTATE_PERSONAL_MEETING_DISABLE_KEY + '-' + pathLocalID);
    if (storedData) {
        return JSON.parse(storedData).disabledUntil;
    }
    return undefined;
};

export const saveRotatePersonalMeetingDisable = (disabledUntil: number) => {
    const pathLocalID = getLocalIDFromPathname(location.pathname);
    localStorage.setItem(ROTATE_PERSONAL_MEETING_DISABLE_KEY + '-' + pathLocalID, JSON.stringify({ disabledUntil }));
};

export const clearDisabledRotatePersonalMeeting = () => {
    const pathLocalID = getLocalIDFromPathname(location.pathname);
    localStorage.removeItem(ROTATE_PERSONAL_MEETING_DISABLE_KEY + '-' + pathLocalID);
};
