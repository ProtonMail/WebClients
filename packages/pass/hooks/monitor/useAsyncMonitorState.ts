import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useCurrentTabID, usePassCore } from '../../components/Core/PassCoreProvider';
import type { AsyncMonitorState, CompromisedPasswordsState } from '../../components/Monitor/MonitorContext';
import { checkCompromisedPasswords } from '../../store/actions';
import { requestCancel } from '../../store/request/actions';
import {
    selectCompromisedPasswords,
    selectCompromisedPasswordsProgress,
    selectVisibleLoginItems,
} from '../../store/selectors';
import type { UniqueItem } from '../../types';
import { useAsyncRequestDispatch } from '../useDispatchAsyncRequest';
import { useMemoSelector } from '../useMemoSelector';

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

export const useCompromisedPasswords = (): CompromisedPasswordsState => {
    const dispatch = useDispatch();
    const asyncDispatch = useAsyncRequestDispatch();
    const tabId = useCurrentTabID();
    const generation = useRef(0);
    const logins = useSelector(selectVisibleLoginItems);
    const data = useMemoSelector(selectCompromisedPasswords, []);
    const progress = useSelector(selectCompromisedPasswordsProgress);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const dto = { tabId, generation: generation.current++ };
        const requestId = checkCompromisedPasswords.requestID(dto);
        let stale = false;

        setLoading(true);
        void asyncDispatch(checkCompromisedPasswords, dto).finally(() => {
            if (!stale) setLoading(false);
        });

        return () => {
            stale = true;
            dispatch(requestCancel(requestId));
        };
    }, [logins, tabId]);

    return useMemo(() => ({ data, count: data.length, loading, progress }), [data, loading, progress]);
};
