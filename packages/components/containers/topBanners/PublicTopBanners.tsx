import React from 'react';

import OnlineTopBanner from './OnlineTopBanner';
import NewVersionTopBanner from './NewVersionTopBanner';

const PublicTopBanners = () => {
    return (
        <>
            <OnlineTopBanner isPublic />
            <NewVersionTopBanner />
        </>
    );
};

export default PublicTopBanners;
