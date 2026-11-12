import type { MeetExtraThunkArguments } from '@proton/meet/store/store';
import { getMeetingLink } from '@proton/meet/utils/getMeetingLink';

import { getUrlMeetingLinkName, getUrlMeetingPassword } from '../hooks/srp/getUrlMeetingParams';
import { getBrowserPreference, getDesktopAppOption, tryOpenInDesktopApp } from './desktopAppDetector';
import { getOpenInDesktopAppStorageKey } from './storage';

const OPEN_DESKTOP_APP_ON_LOAD_FLAG = 'MeetOpenDesktopAppOnLoad';

const getMeetingLinkFromLocation = () => {
    try {
        const meetingLinkName = getUrlMeetingLinkName();
        const meetingPassword = getUrlMeetingPassword();

        return meetingLinkName && meetingPassword
            ? `${window.location.origin}${getMeetingLink(meetingLinkName, meetingPassword)}`
            : undefined;
    } catch {
        return undefined;
    }
};

export const openDesktopAppOnLoad = ({
    unleashClient,
    userId,
}: {
    unleashClient: Pick<MeetExtraThunkArguments['unleashClient'], 'isEnabled'>;
    userId?: string;
}) => {
    if (getDesktopAppOption(unleashClient.isEnabled(OPEN_DESKTOP_APP_ON_LOAD_FLAG)) !== 'openOnLoad') {
        return;
    }

    if (getBrowserPreference(getOpenInDesktopAppStorageKey(!userId, userId))) {
        return;
    }

    const meetingLink = getMeetingLinkFromLocation();

    if (meetingLink) {
        tryOpenInDesktopApp(meetingLink);
    }
};
