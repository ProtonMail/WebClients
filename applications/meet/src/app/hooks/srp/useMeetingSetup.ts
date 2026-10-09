import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectMeetingLinkName,
    selectMeetingPassword,
    setCurrentMeeting,
} from '@proton/meet/store/slices/currentMeeting';

import { getUrlMeetingLinkName, getUrlMeetingPassword } from './getUrlMeetingParams';

export const useMeetingSetup = () => {
    const dispatch = useMeetDispatch();
    const urlMeetingLinkName = getUrlMeetingLinkName();
    const { createNotification } = useNotifications();
    const lastHashError = useRef<string | null>(null);

    let urlMeetingPassword = '';
    try {
        urlMeetingPassword = getUrlMeetingPassword();
    } catch (error) {
        // We avoid showing the error notification multiple times for the same password
        if (lastHashError.current !== window.location.hash) {
            lastHashError.current = window.location.hash;
            createNotification({
                type: 'error',
                text: c('Error').t`The meeting password is invalid`,
            });
        }
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
    };
};
