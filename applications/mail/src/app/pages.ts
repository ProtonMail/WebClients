import { c } from 'ttag';
import { SectionConfig } from 'react-components';
import { UserModel } from 'proton-shared/lib/interfaces';

import { getImportPage } from './containers/settings/ImportContainer';
import { getAddressesPage } from './containers/settings/AddressesContainer';
import { getIdentityPage } from './containers/settings/IdentityContainer';
import { getGeneralPage } from './containers/settings/GeneralContainer';
import { getAppearancePage } from './containers/settings/AppearanceContainer';
import { getFiltersPage } from './containers/settings/FiltersContainer';
import { getLabelsPage } from './containers/settings/FoldersLabelsContainer';
import { getSecurityPage } from './containers/settings/SecurityContainer';
import { getAppsPage } from './containers/settings/AppsContainer';
import { getBridgePage } from './containers/settings/BridgeContainer';
import { getAutoReply } from './containers/settings/AutoReplyContainer';

export const getOverviewPage = () => {
    return {
        text: c('Title').t`Overview`,
        to: '/settings/overview',
        icon: 'apps',
    };
};

export const getPages = (user: UserModel): SectionConfig[] => [
    getOverviewPage(),
    getGeneralPage(),
    getImportPage(),
    getAddressesPage(user),
    getIdentityPage(),
    getAppearancePage(),
    getLabelsPage(),
    getFiltersPage(),
    getAutoReply(),
    getSecurityPage(),
    getAppsPage(),
    getBridgePage(),
];
