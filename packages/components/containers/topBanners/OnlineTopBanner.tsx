import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { ping } from '@proton/shared/lib/api/tests';
import { PROTON_WEBSITES } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useDebounceInput } from '../../components';
import { useOnline } from '../../hooks';
import useApi from '../../hooks/useApi';
import useApiStatus from '../../hooks/useApiStatus';
import TopBanner from './TopBanner';

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
            // translator: At the end of a longer sentence "Servers are unreachable. Please try again in a few minutes or check our status page"
            const statusPageLink = (
                <Href href={PROTON_WEBSITES.PROTON_STATUS_PAGE} target="_blank">{c('Error').t`status page`}</Href>
            );
            return (
                <TopBanner className="bg-danger">
                    {
                        // translator: full sentence "Servers are unreachable. Please try again in a few minutes or check our status page"
                        c('Error')
                            .jt`Servers are unreachable. Please try again in a few minutes or check our ${statusPageLink}`
                    }
                </TopBanner>
            );
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
