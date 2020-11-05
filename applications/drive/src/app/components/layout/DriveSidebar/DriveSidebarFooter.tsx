import React from 'react';
import { c } from 'ttag';
import { AppVersion, Icon } from 'react-components';

import changelog from '../../../../../CHANGELOG.md';

const DriveSidebarFooter = () => (
    <>
        <div className="aligncenter opacity-50 mr4 ml4">
            <Icon name="lock-check" size={20} />
            <div className="small m0">{c('Label').t`Zero-Access Encryption by Proton`}</div>
            <hr className="opacity-30 m0-25" />
        </div>
        <AppVersion changelog={changelog} />
    </>
);

export default DriveSidebarFooter;
