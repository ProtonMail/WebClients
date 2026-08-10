import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { AsyncMonitorState } from '@proton/pass/components/Monitor/MonitorContext';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { selectCompromisedPasswords, selectVisibleLoginItems } from '@proton/pass/store/selectors';
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

export const useCompromisedPasswords = (): AsyncMonitorState => {
    const { checkCompromisedPasswords } = usePassCore().monitor;
    const logins = useSelector(selectVisibleLoginItems);
    const data = useMemoSelector(selectCompromisedPasswords, []);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        checkCompromisedPasswords()
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [logins]);

    return useMemo(() => ({ data, count: data.length, loading }), [data, loading]);
};
