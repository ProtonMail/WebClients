import React, { useState, useEffect } from 'react';
import { c } from 'ttag';

import { useOnline } from '../../hooks';
import TopBanner from './TopBanner';

const OnlineTopBanner = () => {
    const onlineStatus = useOnline();
    const [backOnline, setBackOnline] = useState(false);

    useEffect(() => {
        if (!onlineStatus) {
            setBackOnline(true);
        }

        if (onlineStatus) {
            const timeout = window.setTimeout(() => {
                setBackOnline(false);
            }, 2000);
            return () => window.clearTimeout(timeout);
        }
    }, [onlineStatus]);

    if (onlineStatus && backOnline) {
        return <TopBanner className="bg-global-success">{c('Info').t`Internet connection restored.`}</TopBanner>;
    }

    if (onlineStatus) {
        return null;
    }

    return (
        <TopBanner className="bg-global-warning">{c('Info')
            .t`Internet connection lost. Please check your device's connectivity.`}</TopBanner>
    );
};

export default OnlineTopBanner;
