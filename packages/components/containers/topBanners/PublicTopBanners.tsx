import React from 'react';

import OnlineTopBanner from './OnlineTopBanner';
import NewVersionTopBanner from './NewVersionTopBanner';
import WelcomeV4TopBanner from './WelcomeV4TopBanner';

const PublicTopBanners = () => {
    return (
        <>
            <OnlineTopBanner />
            <NewVersionTopBanner />
            <WelcomeV4TopBanner />
        </>
    );
};

export default PublicTopBanners;
