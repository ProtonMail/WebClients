import React, { useState, useEffect, useRef } from 'react';
import { c } from 'ttag';
import { ping } from '@proton/shared/lib/api/tests';
import { noop } from '@proton/shared/lib/helpers/function';

import { useOnline } from '../../hooks';
import TopBanner from './TopBanner';
import useApiStatus from '../../hooks/useApiStatus';
import useApi from '../../hooks/useApi';
import { useDebounceInput } from '../../components';

const OFFLINE_TIMEOUT = 2500;

const OnlineTopBanner = () => {
    const { apiUnreachable, offline } = useApiStatus();
    const onlineStatus = useOnline();
    const safeOnlineStatusValue = onlineStatus && !offline;
    const safeOnlineStatus = useDebounceInput(safeOnlineStatusValue, safeOnlineStatusValue ? 0 : OFFLINE_TIMEOUT);
    const api = useApi();

    const oldRef = useRef(safeOnlineStatus);
    const [backOnline, setBackOnline] = useState(false);

    const handlePing = () => {
        // Ping can only be used to resolve if the client can establish a connection to the API.
        api(ping()).catch(noop);
    };

    useEffect(() => {
        if (oldRef.current === safeOnlineStatus) {
            return;
        }
        oldRef.current = safeOnlineStatus;

        if (!safeOnlineStatus) {
            const handle = window.setInterval(() => {
                handlePing();
            }, 5000);
            return () => window.clearInterval(handle);
        }

        setBackOnline(true);

        const handle = window.setTimeout(() => {
            setBackOnline(false);
            // Ensure it's true
            handlePing();
        }, 2000);

        return () => window.clearTimeout(handle);
    }, [safeOnlineStatus]);

    if (safeOnlineStatus && backOnline) {
        return <TopBanner className="bg-success">{c('Info').t`Internet connection restored.`}</TopBanner>;
    }

    if (safeOnlineStatus) {
        // If the device is known to be online, and the API is unreachable
        if (apiUnreachable) {
            return <TopBanner className="bg-danger">{apiUnreachable}</TopBanner>;
        }
        return null;
    }

    // If the device is known to be offline, the API unreachable is not displayed.
    return (
        <TopBanner className="bg-danger">{c('Info')
            .t`Internet connection lost. Please check your device's connectivity.`}</TopBanner>
    );
};

export default OnlineTopBanner;
