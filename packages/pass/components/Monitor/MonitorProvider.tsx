import type { FC, PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';

import {
    useCompromisedPasswords,
    useInsecurePasswords,
    useMissing2FAs,
} from '../../hooks/monitor/useAsyncMonitorState';
import { useMemoSelector } from '../../hooks/useMemoSelector';
import { useRequest } from '../../hooks/useRequest';
import { intoAliasMonitorAddress } from '../../lib/monitor/monitor.utils';
import type { AddressType, MonitorAddress } from '../../lib/monitor/types';
import { deleteCustomAddress, getBreaches } from '../../store/actions';
import {
    selectCustomBreaches,
    selectDuplicatePasswords,
    selectExcludedItems,
    selectMonitorState,
    selectProtonBreaches,
    selectTotalBreaches,
    selectVisibleAliasItems,
} from '../../store/selectors';
import type { MaybeNull } from '../../types';
import { CustomAddressAddModal } from './Address/CustomAddressAddModal';
import { CustomAddressVerifyModal } from './Address/CustomAddressVerifyModal';
import { MonitorContext, type MonitorContextValue } from './MonitorContext';

type MonitorAction =
    { type: 'add' } | { type: 'verify'; data: MonitorAddress<AddressType.CUSTOM> & { sentAt?: number } };

export const MonitorProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const didLoad = useSelector(selectMonitorState) !== null;

    const aliases = useSelector(selectVisibleAliasItems) ?? [];
    const proton = useSelector(selectProtonBreaches) ?? [];
    const custom = useSelector(selectCustomBreaches) ?? [];
    const count = useSelector(selectTotalBreaches) ?? 0;

    const duplicates = useMemoSelector(selectDuplicatePasswords, []);
    const excluded = useMemoSelector(selectExcludedItems, []);
    const missing2FAs = useMissing2FAs();
    const insecure = useInsecurePasswords();
    const compromised = useCompromisedPasswords();

    const [action, setAction] = useState<MaybeNull<MonitorAction>>(null);
    const onClose = () => setAction(null);

    const loadBreaches = useRequest(getBreaches, {
        loading: true,
        initial: true,
        onFailure: () => {
            createNotification({
                type: 'error',
                text: c('Warning').t`Failed to load breaches.`,
            });
        },
    });

    const handles = useMemo<Pick<MonitorContextValue, 'addAddress' | 'verifyAddress' | 'sync' | 'deleteAddress'>>(
        () => ({
            addAddress: () => setAction({ type: 'add' }),
            verifyAddress: (data, sentAt) => setAction({ type: 'verify', data: { ...data, sentAt } }),
            deleteAddress: (addressID) => dispatch(deleteCustomAddress.intent(addressID)),
            sync: () => loadBreaches.revalidate(),
        }),
        [loadBreaches.revalidate]
    );

    const breaches = useMemo<MonitorContextValue['breaches']>(
        () => ({
            data: {
                alias: aliases.map(intoAliasMonitorAddress),
                proton,
                custom,
            },
            loading: loadBreaches.loading,
            count,
        }),
        [aliases, proton, custom, count, loadBreaches.loading]
    );

    const context = useMemo<MonitorContextValue>(
        () => ({
            didLoad,
            breaches,
            insecure,
            compromised,
            missing2FAs,
            duplicates: { data: duplicates, count: duplicates.length },
            excluded: { data: excluded, count: excluded.length },
            ...handles,
        }),
        [breaches, insecure, compromised, duplicates, missing2FAs, excluded, didLoad]
    );

    useEffect(() => {
        /** Always fetch on mount, regardless of sync strategy. `syncV2` also
         * fetches breaches as part of the initial full sync (`user-events.sync.ts`),
         * but that only runs on first login / strategy migration (`fromCache`
         * false) — never on an ordinary reload with an existing session. Without
         * this unconditional dispatch, `SyncStrategy.USER_EVENTS` reloads would
         * show stale cached data (or a false "failed to load" state, since
         * nothing was ever dispatched) until a live `BreachesUpdate` event
         * happens to arrive. This does mean one harmless duplicate `GET
         * pass/v1/breach` on first login under `USER_EVENTS` specifically,
         * since `syncV2` will have just fetched the same data. */
        loadBreaches.dispatch();
    }, []);

    return (
        <MonitorContext.Provider value={context}>
            {children}
            {action?.type === 'add' && <CustomAddressAddModal onClose={onClose} />}
            {action?.type === 'verify' && <CustomAddressVerifyModal {...action.data} onClose={onClose} />}
        </MonitorContext.Provider>
    );
};
