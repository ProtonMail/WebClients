import React from 'react';
import { c } from 'ttag';

import { FEATURE_FLAGS } from 'proton-shared/lib/constants';
import { SidebarList } from 'react-components';
import DriveSidebarListItem from './DriveSidebarListItem';

interface Props {
    shareId?: string;
}

const DriveSidebarList = ({ shareId }: Props) => (
    <SidebarList>
        <DriveSidebarListItem to="/" icon="inbox" shareId={shareId}>
            {c('Link').t`My files`}
        </DriveSidebarListItem>
        {FEATURE_FLAGS.includes('drive-sharing') && (
            <DriveSidebarListItem to="/shared-urls" icon="link" shareId={shareId}>
                {c('Link').t`Shared`}
            </DriveSidebarListItem>
        )}
        <DriveSidebarListItem to="/trash" icon="trash" shareId={shareId}>
            {c('Link').t`Trash`}
        </DriveSidebarListItem>
    </SidebarList>
);

export default DriveSidebarList;
