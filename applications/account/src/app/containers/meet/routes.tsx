import type { SidebarConfig } from '@proton/components';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';

export const getMeetAppRoutes = (): SidebarConfig => {
    return {
        header: MEET_APP_NAME,
        routes: {},
    };
};
