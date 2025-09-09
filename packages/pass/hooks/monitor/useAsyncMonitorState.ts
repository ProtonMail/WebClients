import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { AsyncMonitorState } from '@proton/pass/components/Monitor/MonitorContext';
import { selectVisibleLoginItems } from '@proton/pass/store/selectors';
import type { UniqueItem } from '@proton/pass/types';

const useAsyncMonitorState = (datasource: () => Promise<UniqueItem[]>): AsyncMonitorState => {
    const logins = useSelector(selectVisibleLoginItems);
    const [state, setState] = useState<AsyncMonitorState>({ data: [], loading: true, count: 0 });

    useEffect(() => {
        (async () => {
            setState((prev) => ({ ...prev, loading: true }));
            const data = await datasource();
            setState((prev) => ({ ...prev, loading: false, data, count: data.length }));
        })().catch(() => setState((prev) => ({ ...prev, loading: false })));
    }, [logins]);

    return state;
};

export const useMissing2FAs = () => useAsyncMonitorState(usePassCore().monitor.checkMissing2FAs);
export const useInsecurePasswords = () => useAsyncMonitorState(usePassCore().monitor.checkWeakPasswords);
