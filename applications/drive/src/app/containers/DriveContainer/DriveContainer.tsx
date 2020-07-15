import React from 'react';
import { PrivateAppContainer, useToggle } from 'react-components';
import { Route, Redirect, Switch } from 'react-router-dom';
import AppHeader from '../../components/layout/AppHeader';
import AppSidebar from '../../components/layout/AppSidebar';
import DriveContainerView from './DriveContainerView';
import UploadButton from '../../components/uploads/UploadButton';
import UploadDragDrop from '../../components/uploads/UploadDragDrop/UploadDragDrop';

const DriveContainer = () => {
    const { state: expanded, toggle: toggleExpanded } = useToggle();

    const header = (
        <AppHeader
            floatingPrimary={<UploadButton floating />}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    const sidebar = (
        <AppSidebar primary={<UploadButton />} isHeaderExpanded={expanded} toggleHeaderExpanded={toggleExpanded} />
    );

    return (
        <UploadDragDrop>
            <PrivateAppContainer header={header} sidebar={sidebar}>
                <Switch>
                    <Route path="/drive/:shareId?/:type?/:linkId?" exact component={DriveContainerView} />
                    <Redirect to="/drive" />
                </Switch>
            </PrivateAppContainer>
        </UploadDragDrop>
    );
};

export default DriveContainer;
