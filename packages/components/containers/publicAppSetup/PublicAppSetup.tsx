import { ReactNode, useEffect, useState } from 'react';

import { useFlagsReady } from '@proton/components/containers';

interface Props {
    loader: ReactNode;
    children: ReactNode;
}

const PublicAppSetup = ({ loader, children }: Props) => {
    const flagsReadyPromise = useFlagsReady();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        void flagsReadyPromise.finally(() => {
            setLoaded(true);
        });
    }, []);

    return <>{loaded ? children : loader}</>;
};

export default PublicAppSetup;
