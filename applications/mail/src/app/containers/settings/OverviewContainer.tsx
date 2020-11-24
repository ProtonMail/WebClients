import React from 'react';
import { c } from 'ttag';
import { PrivateMainArea, useAppTitle, OverviewLayout } from 'react-components';
import { UserModel } from 'proton-shared/lib/interfaces';

import { getPages } from '../../pages';

interface Props {
    user: UserModel;
}

const OverviewContainer = ({ user }: Props) => {
    const pages = getPages(user).filter(({ to }) => !to.includes('overview'));
    useAppTitle(c('Title').t`Overview`);

    return (
        <PrivateMainArea className="flex">
            <OverviewLayout pages={pages} title={c('Title').t`Mail settings`} limit={5} />
        </PrivateMainArea>
    );
};

export default OverviewContainer;
