import { useRef } from 'react';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';

import { useMeetingAuthentication } from './useMeetingAuthentication';
import { getPublicToken, getUrlPassword } from './usePublicToken';

export const useMeetingSetup = () => {
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
