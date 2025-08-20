import { type ReactNode, useEffect } from 'react';

import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';
import { loadSyncList } from '@proton/activation/src/logic/sync/sync.actions';

interface Props {
    children: ReactNode;
}

const EasySwitchStoreInitializer = ({ children }: Props) => {
    const easySwitchDispatch = useEasySwitchDispatch();

    // Fetch syncs
    useEffect(() => {
        const request = easySwitchDispatch(loadSyncList());
        return () => {
            request.abort();
        };
    }, []);

    return <>{children}</>;
};

export default EasySwitchStoreInitializer;
