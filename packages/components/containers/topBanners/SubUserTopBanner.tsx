import React from 'react';
import { c } from 'ttag';

import { useUser } from '../../hooks';
import TopBanner from './TopBanner';

const SubUserTopBanner = () => {
    const [user] = useUser();

    if (!user.isSubUser) {
        return null;
    }

    return (
        <TopBanner className="bg-info">{c('Info')
            .t`You are currently signed in as ${user.Name} (${user.Email}) and have restricted access.`}</TopBanner>
    );
};

export default SubUserTopBanner;
