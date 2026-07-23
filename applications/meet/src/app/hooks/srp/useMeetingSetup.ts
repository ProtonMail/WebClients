import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setMeetingInfo } from '@proton/meet/store/slices/meetingInfo';

import { useMeetingAuthentication } from './useMeetingAuthentication';
import { getPublicToken, getUrlPassword } from './usePublicToken';

export const useMeetingSetup = () => {
    const dispatch = useMeetDispatch();
    const token = getPublicToken();
    const { createNotification } = useNotifications();
    const lastHashError = useRef<string | null>(null);

    let urlPassword = '';
    try {
        urlPassword = getUrlPassword();
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

    useEffect(() => {
        dispatch(setMeetingInfo({ meetingLinkName: token, meetingPassword: urlPassword }));
    }, [dispatch, token, urlPassword]);

    const { getMeetingDetails, getAccessDetails, initHandshake, getMeetingInfo } = useMeetingAuthentication();

    return {
        token,
        urlPassword,
        getMeetingDetails,
        getAccessDetails,
        initHandshake,
        getMeetingInfo,
    };
};
