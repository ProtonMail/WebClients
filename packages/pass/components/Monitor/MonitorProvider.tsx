import type { FC, PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useInsecurePasswords, useMissing2FAs } from '@proton/pass/hooks/monitor/useAsyncMonitorState';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { intoAliasMonitorAddress } from '@proton/pass/lib/monitor/monitor.utils';
import type { AddressType, MonitorAddress } from '@proton/pass/lib/monitor/types';
import { deleteCustomAddress, getBreaches } from '@proton/pass/store/actions';
import {
    selectAliasItems,
    selectCustomBreaches,
    selectDuplicatePasswords,
    selectExcludedItems,
    selectMonitorState,
    selectProtonBreaches,
    selectTotalBreaches,
} from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';

import { CustomAddressAddModal } from './Address/CustomAddressAddModal';
import { CustomAddressVerifyModal } from './Address/CustomAddressVerifyModal';
import { MonitorContext, type MonitorContextValue } from './MonitorContext';

type MonitorAction =
    | { type: 'add' }
    | { type: 'verify'; data: MonitorAddress<AddressType.CUSTOM> & { sentAt?: number } };

export const MonitorProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const didLoad = useSelector(selectMonitorState) !== null;

    const aliases = useSelector(selectAliasItems) ?? [];
    const proton = useSelector(selectProtonBreaches) ?? [];
    const custom = useSelector(selectCustomBreaches) ?? [];
    const count = useSelector(selectTotalBreaches) ?? 0;

    const duplicates = useMemoSelector(selectDuplicatePasswords, []);
    const excluded = useMemoSelector(selectExcludedItems, []);
    const missing2FAs = useMissing2FAs();
    const insecure = useInsecurePasswords();

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
            sync: loadBreaches.revalidate,
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
            missing2FAs,
            duplicates: { data: duplicates, count: duplicates.length },
            excluded: { data: excluded, count: excluded.length },
            ...handles,
        }),
        [breaches, insecure, duplicates, missing2FAs, excluded, didLoad]
    );

    useEffect(() => loadBreaches.dispatch(), []);

    return (
        <MonitorContext.Provider value={context}>
            {children}

            {action?.type === 'add' && <CustomAddressAddModal onClose={onClose} />}
            {action?.type === 'verify' && <CustomAddressVerifyModal {...action.data} onClose={onClose} />}
        </MonitorContext.Provider>
    );
};
