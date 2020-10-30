import React, { useState, useEffect, useRef } from 'react';
import { c } from 'ttag';
import { getUser } from 'proton-shared/lib/api/user';
import { ping } from 'proton-shared/lib/api/tests';

import { useLoading, useOnline } from '../../hooks';
import TopBanner from './TopBanner';
import useApiStatus from '../../hooks/useApiStatus';
import { InlineLinkButton } from '../../components/button';
import useApi from '../../hooks/useApi';

interface Props {
    isPublic?: boolean;
}

const OnlineTopBanner = ({ isPublic = false }: Props) => {
    const onlineStatus = useOnline();
    const { apiUnreachable } = useApiStatus();
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const oldRef = useRef(onlineStatus);
    const [backOnline, setBackOnline] = useState(false);

    const handleRetry = () => {
        return api(isPublic ? ping() : getUser());
    };

    useEffect(() => {
        if (oldRef.current === onlineStatus) {
            return;
        }
        oldRef.current = onlineStatus;

        if (!onlineStatus) {
            setBackOnline(false);
            return;
        }

        // When coming back online, Fire of a ping request in case the api status is offline
        api(ping());
        setBackOnline(true);

        const timeout = window.setTimeout(() => {
            setBackOnline(false);
        }, 2000);

        return () => window.clearTimeout(timeout);
    }, [onlineStatus]);

    if (onlineStatus && backOnline) {
        return <TopBanner className="bg-global-success">{c('Info').t`Internet connection restored.`}</TopBanner>;
    }

    if (onlineStatus) {
        // If the device is known to be online, and the API is unreachable
        if (apiUnreachable) {
            const retryNow = (
                <InlineLinkButton
                    key="0"
                    className="color-currentColor"
                    disabled={loading}
                    onClick={() => withLoading(handleRetry())}
                >
                    {c('Action').t`Retry now`}
                </InlineLinkButton>
            );

            return (
                <TopBanner className="bg-global-warning">{c('Info')
                    .jt`Servers are unreachable. ${retryNow}.`}</TopBanner>
            );
        }
        return null;
    }

    // If the device is known to be offline, the API unreachable is not displayed.
    return (
        <TopBanner className="bg-global-warning">{c('Info')
            .t`Internet connection lost. Please check your device's connectivity.`}</TopBanner>
    );
};

export default OnlineTopBanner;
