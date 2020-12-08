import React from 'react';
import { PrivateAppContainer, useToggle, MainLogo } from 'react-components';
import { Route, Redirect, Switch } from 'react-router-dom';
import DriveHeader from '../../components/layout/DriveHeader';
import DriveSidebar from '../../components/layout/DriveSidebar/DriveSidebar';
import DriveContainerView from './DriveContainerView';
import UploadButton from '../../components/uploads/UploadButton';
import UploadDragDrop from '../../components/uploads/UploadDragDrop/UploadDragDrop';
import AppErrorBoundary from '../../components/AppErrorBoundary';
import PreviewContainer from '../PreviewContainer';
import { LinkURLType } from '../../constants';

const DriveContainer = () => {
    const { state: expanded, toggle: toggleExpanded } = useToggle();

    const logo = <MainLogo to="/" />;
    const header = (
        <DriveHeader
            logo={logo}
            floatingPrimary={<UploadButton floating />}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    const sidebar = (
        <DriveSidebar
            logo={logo}
            primary={<UploadButton className="nomobile" />}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    return (
        <UploadDragDrop className="h100">
            <PrivateAppContainer header={header} sidebar={sidebar}>
                <AppErrorBoundary>
                    <Switch>
                        <Route path="/:shareId?/:type?/:linkId?" exact component={DriveContainerView} />
                        <Redirect to="/" />
                    </Switch>
                    <Route path={`/:shareId?/${LinkURLType.FILE}/:linkId?`} component={PreviewContainer} exact />
                </AppErrorBoundary>
            </PrivateAppContainer>
        </UploadDragDrop>
    );
};

export default DriveContainer;
