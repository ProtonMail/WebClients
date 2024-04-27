import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useInsecurePasswords } from '@proton/pass/hooks/monitor/useInsecurePasswords';
import { useMissing2FAs } from '@proton/pass/hooks/monitor/useMissing2FAs';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import type { AddressType, CustomAddressID, MonitorAddress } from '@proton/pass/lib/monitor/types';
import { addCustomAddress, deleteCustomAddress, getBreaches } from '@proton/pass/store/actions';
import { breachesRequest } from '@proton/pass/store/actions/requests';
import {
    selectAliasBreaches,
    selectCustomBreaches,
    selectDuplicatePasswords,
    selectExcludedItems,
    selectProtonBreaches,
    selectTotalBreaches,
} from '@proton/pass/store/selectors';
import type { MaybeNull, UniqueItem } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { CustomAddressAddModal } from './Address/CustomAddressAddModal';
import { CustomAddressVerifyModal } from './Address/CustomAddressVerifyModal';

type MonitorAction =
    | { type: 'add' }
    | { type: 'verify'; data: MonitorAddress<AddressType.CUSTOM> & { sentAt?: number } };

export interface MonitorContextValue {
    enabled: boolean;
    refreshedAt: MaybeNull<number>;
    breaches: {
        data: {
            alias: MonitorAddress<AddressType.ALIAS>[];
            proton: MonitorAddress<AddressType.PROTON>[];
            custom: MonitorAddress<AddressType.CUSTOM>[];
        };
        count: number;
        loading: boolean;
    };
    insecure: { data: UniqueItem[]; count: number };
    duplicates: { data: UniqueItem[][]; count: number };
    missing2FAs: { data: UniqueItem[]; count: number };
    excluded: { data: UniqueItem[]; count: number };
    addAddress: (email?: string) => void;
    verifyAddress: (address: MonitorAddress<AddressType.CUSTOM>, sentAt?: number) => void;
    deleteAddress: (addressId: CustomAddressID) => void;
}

const MonitorContext = createContext<MaybeNull<MonitorContextValue>>(null);

export const MonitorProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();

    const enabled = useFeatureFlag(PassFeature.PassMonitor);
    const [refreshedAt, setRefreshedAt] = useState<MaybeNull<number>>(null);
    const [action, setAction] = useState<MaybeNull<MonitorAction>>(null);
    const onClose = () => setAction(null);

    const alias = useSelector(selectAliasBreaches) ?? [];
    const proton = useSelector(selectProtonBreaches) ?? [];
    const custom = useSelector(selectCustomBreaches) ?? [];
    const count = useSelector(selectTotalBreaches) ?? 0;

    const duplicates = useSelector(selectDuplicatePasswords);
    const missing2FAs = useMissing2FAs();
    const insecure = useInsecurePasswords();
    const excluded = useSelector(selectExcludedItems);

    const breaches = useRequest(getBreaches, {
        initialRequestId: breachesRequest(),
        onSuccess: () => setRefreshedAt(getEpoch()),
    });

    useEffect(() => breaches.revalidate(), []);

    const context = useMemo<MonitorContextValue>(
        () => ({
            enabled,
            refreshedAt,
            breaches: { data: { alias, proton, custom }, loading: breaches.loading, count },
            insecure,
            missing2FAs,
            duplicates: { data: duplicates, count: duplicates.length },
            excluded: { data: excluded, count: excluded.length },
            addAddress: (email) => (email ? dispatch(addCustomAddress.intent(email)) : setAction({ type: 'add' })),
            verifyAddress: (data, sentAt) => setAction({ type: 'verify', data: { ...data, sentAt } }),
            deleteAddress: (addressId) => dispatch(deleteCustomAddress.intent(addressId)),
        }),
        [enabled, breaches, insecure, duplicates, missing2FAs, excluded, refreshedAt]
    );
    return (
        <MonitorContext.Provider value={context}>
            {children}

            {action?.type === 'add' && <CustomAddressAddModal onClose={onClose} />}
            {action?.type === 'verify' && <CustomAddressVerifyModal {...action.data} onClose={onClose} />}
        </MonitorContext.Provider>
    );
};

export const useMonitor = (): MonitorContextValue => {
    const ctx = useContext(MonitorContext);
    if (!ctx) throw new Error('MonitorContext not initialized');
    return ctx;
};
