import { AppVersion } from '@proton/components';

import changelog from '../../../../CHANGELOG.md';

const SidebarVersion = () => {
    return <AppVersion changelog={changelog} />;
};

export default SidebarVersion;
