import React from 'react';

import NewVersionTopBanner from './NewVersionTopBanner';
import DelinquentTopBanner from './DelinquentTopBanner';
import StorageLimitTopBanner from './StorageLimitTopBanner';
import OnlineTopBanner from './OnlineTopBanner';

const TopBanners = () => {
    return (
        <>
            <DelinquentTopBanner />
            <OnlineTopBanner />
            <StorageLimitTopBanner />
            <NewVersionTopBanner />
        </>
    );
};

export default TopBanners;
