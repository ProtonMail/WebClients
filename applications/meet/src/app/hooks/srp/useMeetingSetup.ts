import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setCurrentMeeting } from '@proton/meet/store/slices/currentMeeting';

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
        dispatch(setCurrentMeeting({ meetingLinkName: token, meetingPassword: urlPassword }));
    }, [dispatch, token, urlPassword]);

    return {
        token,
        urlPassword,
    };
};
