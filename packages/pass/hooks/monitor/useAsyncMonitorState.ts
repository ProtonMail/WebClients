import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useCurrentTabID, usePassCore } from '../../components/Core/PassCoreProvider';
import type { AsyncMonitorState, CompromisedPasswordsState } from '../../components/Monitor/MonitorContext';
import { checkCompromisedPasswords } from '../../store/actions/creators/monitor';
import { requestCancel } from '../../store/request/actions';
import { selectVisibleLoginItems } from '../../store/selectors/items';
import { selectCompromisedPasswords, selectCompromisedPasswordsProgress } from '../../store/selectors/monitor';
import type { UniqueItem } from '../../types/data/items';
import { useAsyncRequestDispatch } from '../useDispatchAsyncRequest';
import { useMemoSelector } from '../useMemoSelector';

const IDLE_ASYNC_MONITOR_STATE: AsyncMonitorState = { data: [], loading: false, count: 0 };

const useAsyncMonitorState = (datasource: () => Promise<UniqueItem[]>, enabled: boolean): AsyncMonitorState => {
    const logins = useSelector(selectVisibleLoginItems);
    const [state, setState] = useState<AsyncMonitorState>(() =>
        enabled ? { data: [], loading: true, count: 0 } : IDLE_ASYNC_MONITOR_STATE
    );

    useEffect(() => {
        if (!enabled) {
            setState(IDLE_ASYNC_MONITOR_STATE);
            return;
        }

        let stale = false;

        (async () => {
            setState((prev) => ({ ...prev, loading: true }));
            const data = await datasource();
            if (!stale) setState({ loading: false, data, count: data.length });
        })().catch(() => {
            if (!stale) setState((prev) => ({ ...prev, loading: false }));
        });

        return () => {
            stale = true;
        };
    }, [enabled, logins]);

    return state;
};

export const useMissing2FAs = (enabled = true) => useAsyncMonitorState(usePassCore().monitor.checkMissing2FAs, enabled);
export const useInsecurePasswords = (enabled = true) =>
    useAsyncMonitorState(usePassCore().monitor.checkWeakPasswords, enabled);

export const useCompromisedPasswords = (enabled = true): CompromisedPasswordsState => {
    const dispatch = useDispatch();
    const asyncDispatch = useAsyncRequestDispatch();
    const tabId = useCurrentTabID();
    const generation = useRef(0);
    const logins = useSelector(selectVisibleLoginItems);
    const data = useMemoSelector(selectCompromisedPasswords, []);
    const progress = useSelector(selectCompromisedPasswordsProgress);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }

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
    }, [asyncDispatch, dispatch, enabled, logins, tabId]);

    return useMemo(() => ({ data, count: data.length, loading, progress }), [data, loading, progress]);
};
