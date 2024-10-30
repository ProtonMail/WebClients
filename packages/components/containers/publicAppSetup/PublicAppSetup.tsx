import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { getInboxDesktopInfo, hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { reportClientLaunch } from '@proton/shared/lib/desktop/reportClientLaunch';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { useFlagsReady } from '@proton/unleash';

interface Props {
    loader: ReactNode;
    children: ReactNode;
}

const PublicAppSetup = ({ loader, children }: Props) => {
    const flagsReadyPromise = useFlagsReady();
    const [loaded, setLoaded] = useState(false);
    const api = useApi();

    useEffect(() => {
        void flagsReadyPromise.finally(() => {
            setLoaded(true);
        });

        if (isElectronMail && hasInboxDesktopFeature('InstallSource')) {
            void reportClientLaunch(getInboxDesktopInfo('installSource'), 'mail', api);
        }
    }, []);

    return <>{loaded ? children : loader}</>;
};

export default PublicAppSetup;
