import React from 'react';

import NewVersionTopBanner from './NewVersionTopBanner';
import DelinquentTopBanner from './DelinquentTopBanner';
import StorageLimitTopBanner from './StorageLimitTopBanner';
import OnlineTopBanner from './OnlineTopBanner';
import SubUserTopBanner from './SubUserTopBanner';

const TopBanners = () => {
    return (
        <>
            <DelinquentTopBanner />
            <OnlineTopBanner />
            <StorageLimitTopBanner />
            <NewVersionTopBanner />
            <SubUserTopBanner />
        </>
    );
};

export default TopBanners;
