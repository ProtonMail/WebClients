import { useEffect } from 'react';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectMeetingLinkName,
    selectMeetingPassword,
    setCurrentMeeting,
} from '@proton/meet/store/slices/currentMeeting';
import { getUrlMeetingLinkName } from '@proton/meet/utils/getUrlMeetingLinkName';

import { getUrlMeetingPassword } from './getUrlMeetingParams';

export const useMeetingSetup = () => {
    const dispatch = useMeetDispatch();
    const urlMeetingLinkName = getUrlMeetingLinkName();

    let urlMeetingPassword = '';
    let isUrlMeetingPasswordInvalid = false;
    try {
        urlMeetingPassword = getUrlMeetingPassword();
    } catch {
        isUrlMeetingPasswordInvalid = true;
    }

    const storedMeetingLinkName = useMeetSelector(selectMeetingLinkName);
    const storedMeetingPassword = useMeetSelector(selectMeetingPassword);

    useEffect(() => {
        if (
            !urlMeetingLinkName ||
            (storedMeetingLinkName === urlMeetingLinkName && storedMeetingPassword === urlMeetingPassword)
        ) {
            return;
        }
        dispatch(setCurrentMeeting({ meetingLinkName: urlMeetingLinkName, meetingPassword: urlMeetingPassword }));
    }, [dispatch, urlMeetingLinkName, urlMeetingPassword, storedMeetingLinkName, storedMeetingPassword]);

    return {
        urlMeetingLinkName,
        urlMeetingPassword,
        isUrlMeetingPasswordInvalid,
    };
};
