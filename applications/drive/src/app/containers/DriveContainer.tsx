import { useState } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';

import { TopBanners } from '@proton/components';

import { LinkURLType } from '../constants';
import DriveWindow from '../components/layout/DriveWindow';
import FileRecoveryBanner from '../components/FilesRecoveryModal/FileRecoveryBanner';
import UploadSidebarButton from '../components/sections/Drive/UploadButton';
import UploadDragDrop from '../components/uploads/UploadDragDrop/UploadDragDrop';
import DriveView from '../components/sections/Drive/DriveView';
import PreviewContainer from './PreviewContainer';

const DriveContainer = () => {
    const [recoveryBannerVisible, setReoveryBannerVisible] = useState(true);

    const fileRecoveryBanner = recoveryBannerVisible ? (
        <FileRecoveryBanner
            onClose={() => {
                setReoveryBannerVisible(false);
            }}
        />
    ) : null;
    const topBanners = <TopBanners>{fileRecoveryBanner}</TopBanners>;

    return (
        <UploadDragDrop className="h100">
            <DriveWindow topBanners={topBanners} PrimaryButton={UploadSidebarButton}>
                <Switch>
                    <Route path="/:shareId?/:type?/:linkId?" component={DriveView} exact />
                    <Redirect to="/" />
                </Switch>
                <Route path={`/:shareId?/${LinkURLType.FILE}/:linkId?`} component={PreviewContainer} exact />
            </DriveWindow>
        </UploadDragDrop>
    );
};

export default DriveContainer;
