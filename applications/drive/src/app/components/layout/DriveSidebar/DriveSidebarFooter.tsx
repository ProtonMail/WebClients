import React from 'react';
import { AppVersion } from '@proton/components';

import changelog from '../../../../../CHANGELOG.md';

const DriveSidebarFooter = () => <AppVersion changelog={changelog} />;

export default DriveSidebarFooter;
