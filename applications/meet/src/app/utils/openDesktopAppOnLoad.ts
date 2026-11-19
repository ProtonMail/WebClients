import type { MeetExtraThunkArguments } from '@proton/meet/store/store';
import { getMeetingLink } from '@proton/meet/utils/getMeetingLink';
import { getUrlMeetingLinkName } from '@proton/meet/utils/getUrlMeetingLinkName';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

import { getUrlMeetingPassword } from '../hooks/srp/getUrlMeetingParams';
import {
    getBrowserPreference,
    getDesktopAppOption,
    getDesktopAppPreference,
    tryOpenInDesktopApp,
} from './desktopAppDetector';
import { getOpenInDesktopAppStorageKey } from './storage';

const OPEN_DESKTOP_APP_ON_LOAD_FLAG = 'MeetOpenDesktopAppOnLoad';

let triedMeetingLinkName: string | undefined;

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

const openMeetingFromLocation = () => {
    const meeting = getMeetingFromLocation();

    if (meeting && meeting.meetingLinkName !== triedMeetingLinkName) {
        tryOpenInDesktopApp(meeting.meetingLink);
        triedMeetingLinkName = meeting.meetingLinkName;
    }
};

export const openDesktopAppOnLoad = ({
    unleashClient,
    userId,
}: {
    unleashClient: Pick<MeetExtraThunkArguments['unleashClient'], 'isEnabled'>;
    userId?: string;
}) => {
    triedMeetingLinkName = undefined;

    if (isElectronApp) {
        return;
    }

    if (getDesktopAppOption(unleashClient.isEnabled(OPEN_DESKTOP_APP_ON_LOAD_FLAG)) !== 'openOnLoad') {
        return;
    }

    if (getBrowserPreference(getOpenInDesktopAppStorageKey(!userId, userId))) {
        return;
    }

    openMeetingFromLocation();
};

// The pre-join page covers what the load cannot: a meeting opened from the dashboard, a flag that arrived after the load,
// and the app chosen where it is not opened on load
export const openDesktopAppOnPreJoin = ({
    isOpenDesktopAppOnLoadEnabled,
    desktopAppPreferenceStorageKey,
}: {
    isOpenDesktopAppOnLoadEnabled: boolean;
    desktopAppPreferenceStorageKey: string;
}) => {
    const desktopAppOption = getDesktopAppOption(isOpenDesktopAppOnLoadEnabled);
    const shouldOpen =
        desktopAppOption === 'openOnLoad'
            ? !getBrowserPreference(desktopAppPreferenceStorageKey)
            : desktopAppOption === 'appButton' && getDesktopAppPreference(desktopAppPreferenceStorageKey);

    if (shouldOpen) {
        openMeetingFromLocation();
    }
};
