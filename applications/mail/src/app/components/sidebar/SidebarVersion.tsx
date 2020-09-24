import React from 'react';
import { AppVersion } from 'react-components';

import changelog from '../../../../CHANGELOG.md';

const SidebarVersion = () => {
    return <AppVersion changelog={changelog} />;
};

export default SidebarVersion;
