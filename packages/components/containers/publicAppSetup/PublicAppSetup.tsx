import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { useFlagsReady } from '@proton/unleash';

interface Props {
    loader: ReactNode;
    children: ReactNode;
}

const PublicAppSetup = ({ loader, children }: Props) => {
    const api = useApi();

    useEffect(() => {
        if (isElectronMail && hasInboxDesktopFeature('InstallSource')) {
            void reportClientLaunch(getInboxDesktopInfo('installSource'), 'mail', api);
        }
    }, []);

    return children;
};

export default PublicAppSetup;
