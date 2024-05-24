import { SidebarConfig } from '@proton/components';
import { DOCS_APP_NAME } from '@proton/shared/lib/constants';

export const getDocsAppRoutes = (): SidebarConfig => {
    return {
        header: DOCS_APP_NAME,
        routes: {},
    };
};
