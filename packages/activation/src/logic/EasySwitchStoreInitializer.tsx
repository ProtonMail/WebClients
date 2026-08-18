import { type ReactNode, useEffect } from 'react';

import { useEasySwitchDispatch } from './store';
import { loadSyncList } from './sync/sync.actions';

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
