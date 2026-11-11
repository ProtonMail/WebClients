import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { addListener } from '@reduxjs/toolkit';

import { setJoiningInProgress } from '@proton/meet/store/slices/connectionSlice';
import {
    resetCurrentMeeting,
    selectIsMeetingLoading,
    selectMeetingLink,
    selectMeetingLinkName,
    selectMeetingPassword,
} from '@proton/meet/store/slices/currentMeeting';
import { selectMeetingInfoModel } from '@proton/meet/store/slices/meetingInfoModel';
import type { MeetDispatch, MeetExtraThunkArguments, MeetState } from '@proton/meet/store/store';

import { getUrlMeetingLinkName, getUrlMeetingPassword } from '../hooks/srp/getUrlMeetingParams';
import { OPEN_DESKTOP_APP_ON_LOAD_FLAG, getDesktopAppOption, tryOpenInDesktopApp } from './desktopAppDetector';

const addMeetListener = addListener.withTypes<MeetState, MeetDispatch, MeetExtraThunkArguments>();

const getMeetingFromLoadedUrl = () => {
    try {
        const meetingLinkName = getUrlMeetingLinkName();
        const meetingPassword = getUrlMeetingPassword();

        return meetingLinkName && meetingPassword ? { meetingLinkName, meetingPassword } : undefined;
    } catch {
        return undefined;
    }
};

const endsPageLoadPrejoin = (action: UnknownAction) =>
    (setJoiningInProgress.match(action) && action.payload) || resetCurrentMeeting.match(action);

export const startDesktopAppLaunchOnLoad = ({ dispatch }: { dispatch: Dispatch }) => {
    const loadedMeeting = getMeetingFromLoadedUrl();

    if (!loadedMeeting) {
        return;
    }

    const { meetingLinkName, meetingPassword } = loadedMeeting;

    const isLoadedMeetingReady = (state: MeetState) =>
        !selectIsMeetingLoading(state) &&
        selectMeetingLinkName(state) === meetingLinkName &&
        selectMeetingPassword(state) === meetingPassword &&
        selectMeetingInfoModel(state).value?.meetingLinkName === meetingLinkName;

    dispatch(
        addMeetListener({
            predicate: (action, state) => endsPageLoadPrejoin(action) || isLoadedMeetingReady(state),
            effect: (action, listenerApi) => {
                listenerApi.unsubscribe();

                if (endsPageLoadPrejoin(action)) {
                    return;
                }

                const isOpenDesktopAppOnLoadEnabled =
                    listenerApi.extra.unleashClient.isEnabled(OPEN_DESKTOP_APP_ON_LOAD_FLAG);

                if (getDesktopAppOption(isOpenDesktopAppOnLoadEnabled) === 'openOnLoad') {
                    tryOpenInDesktopApp(selectMeetingLink(listenerApi.getState()));
                }
            },
        })
    );
};
