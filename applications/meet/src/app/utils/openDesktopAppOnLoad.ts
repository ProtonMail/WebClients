import type { MeetExtraThunkArguments } from '@proton/meet/store/store';
import { getMeetingLink } from '@proton/meet/utils/getMeetingLink';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

import { getUrlMeetingLinkName, getUrlMeetingPassword } from '../hooks/srp/getUrlMeetingParams';
import { getBrowserPreference, getDesktopAppOption, tryOpenInDesktopApp } from './desktopAppDetector';
import { getOpenInDesktopAppStorageKey } from './storage';

const OPEN_DESKTOP_APP_ON_LOAD_FLAG = 'MeetOpenDesktopAppOnLoad';

let meetingLinkNameTriedOnLoad: string | undefined;

const getMeetingFromLocation = () => {
    try {
        const meetingLinkName = getUrlMeetingLinkName();
        const meetingPassword = getUrlMeetingPassword();

        return meetingLinkName && meetingPassword
            ? {
                  meetingLinkName,
                  meetingLink: `${window.location.origin}${getMeetingLink(meetingLinkName, meetingPassword)}`,
              }
            : undefined;
    } catch {
        return undefined;
    }
};

export const wasDesktopAppTriedOnLoad = (meetingLinkName: string) => meetingLinkName === meetingLinkNameTriedOnLoad;

export const openDesktopAppOnLoad = ({
    unleashClient,
    userId,
}: {
    unleashClient: Pick<MeetExtraThunkArguments['unleashClient'], 'isEnabled'>;
    userId?: string;
}) => {
    meetingLinkNameTriedOnLoad = undefined;

    if (isElectronApp) {
        return;
    }

    if (getDesktopAppOption(unleashClient.isEnabled(OPEN_DESKTOP_APP_ON_LOAD_FLAG)) !== 'openOnLoad') {
        return;
    }

    if (getBrowserPreference(getOpenInDesktopAppStorageKey(!userId, userId))) {
        return;
    }

    const meeting = getMeetingFromLocation();

    if (meeting) {
        tryOpenInDesktopApp(meeting.meetingLink);
        meetingLinkNameTriedOnLoad = meeting.meetingLinkName;
    }
};
