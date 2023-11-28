import { ReactNode, useEffect, useState } from 'react';

import { useFlagsReady } from '@proton/components/containers';

interface Props {
    loader: ReactNode;
    children: ReactNode;
}

const AccountPublicAppSetup = ({ loader, children }: Props) => {
    const flagsReadyPromise = useFlagsReady();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        flagsReadyPromise.finally(() => {
            setLoaded(true);
        });
    }, []);

    return <>{loaded ? children : loader}</>;
};

export default AccountPublicAppSetup;
