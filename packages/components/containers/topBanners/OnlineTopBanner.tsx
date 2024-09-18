import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import useDebounceInput from '@proton/components/components/input/useDebounceInput';
import { ping } from '@proton/shared/lib/api/tests';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useOnline } from '../../hooks';
import useApi from '../../hooks/useApi';
import useApiStatus from '../../hooks/useApiStatus';
import TopBanner from './TopBanner';
import UnreachableTopBanner from './UnreachableTopBanner';

const OFFLINE_TIMEOUT = 5000;

const OnlineTopBanner = () => {
    const { apiUnreachable, offline } = useApiStatus();
    const onlineStatus = useOnline();
    const safeOnlineStatusValue = onlineStatus && !offline;
    const safeOnlineStatus = useDebounceInput(safeOnlineStatusValue, safeOnlineStatusValue ? 0 : OFFLINE_TIMEOUT);
    const api = useApi();

    const oldRef = useRef(safeOnlineStatus);
    const [backOnline, setBackOnline] = useState(false);

    useEffect(() => {
        if (oldRef.current === safeOnlineStatus) {
            return;
        }
        oldRef.current = safeOnlineStatus;

        const handlePing = () => {
            // Ping can only be used to resolve if the client can establish a connection to the API.
            api(ping()).catch(noop);
        };

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
            return <UnreachableTopBanner errorMessage={apiUnreachable} />;
        }
        return null;
    }

    // If the device is known to be offline, the API unreachable is not displayed.
    return (
        <TopBanner className={clsx(isElectronApp ? 'bg-info' : 'bg-danger')}>{c('Info')
            .t`Internet connection lost. Please check your device's connectivity.`}</TopBanner>
    );
};

export default OnlineTopBanner;
