import React from 'react';
import { c } from 'ttag';
import { PrivateMainArea, useAppTitle, useUser, useOrganization, OverviewLayout } from 'react-components';

import { getPages } from '../pages';
import './OverviewContainer.scss';

const OverviewContainer = () => {
    const [user] = useUser();
    const [organization] = useOrganization();
    const pages = getPages(user, organization).filter(({ to }) => to !== '/overview');
    useAppTitle(c('Title').t`Overview`, 'ProtonAccount');

    return (
        <PrivateMainArea className="flex">
            <OverviewLayout pages={pages} title={c('Title').t`Account settings`} limit={6} />
        </PrivateMainArea>
    );
};

export default OverviewContainer;
