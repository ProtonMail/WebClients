import React from 'react';
import { c } from 'ttag';
import { SidebarList } from 'react-components';
import DriveSidebarListItem from './DriveSidebarListItem';

const DriveSidebarList = () => (
    <SidebarList>
        <DriveSidebarListItem to="/" icon="inbox">
            {c('Link').t`My files`}
        </DriveSidebarListItem>
        <DriveSidebarListItem to="/trash" icon="trash">
            {c('Link').t`Trash`}
        </DriveSidebarListItem>
    </SidebarList>
);

export default DriveSidebarList;
