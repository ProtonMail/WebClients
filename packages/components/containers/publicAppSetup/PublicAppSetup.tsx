import type { ReactNode } from 'react';
import { useEffect } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { getInboxDesktopInfo, hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { reportClientLaunch } from '@proton/shared/lib/desktop/reportClientLaunch';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

interface Props {
    children: ReactNode;
}

const PublicAppSetup = ({ children }: Props) => {
    const api = useApi();

    useEffect(() => {
        if (isElectronMail && hasInboxDesktopFeature('InstallSource')) {
            void reportClientLaunch(getInboxDesktopInfo('installSource'), 'mail', api);
        }
    }, []);

    return children;
};

export default PublicAppSetup;
