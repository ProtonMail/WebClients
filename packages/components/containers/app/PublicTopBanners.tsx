import React, { useEffect, useState } from 'react';
import { c } from 'ttag';

import { useOnline } from '../../hooks';
import TopBanner from './TopBanner';

const PublicTopBanners = () => {
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

    return (
        <>
            {onlineStatus ? null : (
                <TopBanner className="bg-global-warning">{c('Info')
                    .t`Internet connection lost. Please check your device's connectivity.`}</TopBanner>
            )}
            {onlineStatus && backOnline ? (
                <TopBanner className="bg-global-success">{c('Info').t`Internet connection restored.`}</TopBanner>
            ) : null}
        </>
    );
};

export default PublicTopBanners;
