import { useEffect, useState } from 'react';

import { usePassCore } from '../../components/Core/PassCoreProvider';
import type { ItemRevision } from '../../types/data/items';

type SingleItemMonitorAsyncState = {
    loading: boolean;
    missing2FA: boolean;
    weak: boolean;
};

const IDLE_SINGLE_ITEM_MONITOR_STATE: SingleItemMonitorAsyncState = {
    loading: false,
    missing2FA: false,
    weak: false,
};

export const useSingleItemMonitorAsyncChecks = (
    revision: ItemRevision,
    enabled: boolean
): SingleItemMonitorAsyncState => {
    const monitor = usePassCore().monitor;
    const [state, setState] = useState<SingleItemMonitorAsyncState>(() =>
        enabled ? { ...IDLE_SINGLE_ITEM_MONITOR_STATE, loading: true } : IDLE_SINGLE_ITEM_MONITOR_STATE
    );

    useEffect(() => {
        if (!enabled || revision.data.type !== 'login') {
            setState(IDLE_SINGLE_ITEM_MONITOR_STATE);
            return;
        }

        let stale = false;

        setState((prev) => ({ ...prev, loading: true }));

        void (async () => {
            try {
                const [weak, missing2FA] = await Promise.all([
                    monitor.checkWeakPasswordForItem(revision),
                    monitor.checkMissing2FAForItem(revision),
                ]);

                if (!stale) setState({ weak, missing2FA, loading: false });
            } catch {
                if (!stale) setState(IDLE_SINGLE_ITEM_MONITOR_STATE);
            }
        })();

        return () => {
            stale = true;
        };
    }, [enabled, monitor, revision.data, revision.itemId, revision.revision, revision.shareId]);

    return state;
};
