import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useInsecurePasswords } from '@proton/pass/hooks/monitor/useInsecurePasswords';
import { useMissing2FAs } from '@proton/pass/hooks/monitor/useMissing2FAs';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import type { AddressType, MonitorAddress } from '@proton/pass/lib/monitor/types';
import { getBreaches } from '@proton/pass/store/actions';
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

export type MonitorContextValue = {
    enabled: boolean;
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
};

const MonitorContext = createContext<MaybeNull<MonitorContextValue>>(null);

export const MonitorProvider: FC<PropsWithChildren> = ({ children }) => {
    const enabled = useFeatureFlag(PassFeature.PassMonitor);
    const alias = useSelector(selectAliasBreaches);
    const proton = useSelector(selectProtonBreaches);
    const custom = useSelector(selectCustomBreaches);
    const count = useSelector(selectTotalBreaches);

    const duplicates = useSelector(selectDuplicatePasswords);
    const missing2FAs = useMissing2FAs();
    const insecure = useInsecurePasswords();
    const excluded = useSelector(selectExcludedItems);

    const breaches = useRequest(getBreaches, { initialRequestId: breachesRequest() });

    useEffect(() => breaches.revalidate(), []);

    const context = useMemo<MonitorContextValue>(
        () => ({
            enabled,
            breaches: { data: { alias, proton, custom }, loading: breaches.loading, count },
            insecure,
            missing2FAs,
            duplicates: { data: duplicates, count: duplicates.length },
            excluded: { data: excluded, count: excluded.length },
        }),
        [enabled, breaches, insecure, duplicates, missing2FAs, excluded]
    );
    return <MonitorContext.Provider value={context}>{children}</MonitorContext.Provider>;
};

export const useMonitor = (): MonitorContextValue => {
    const ctx = useContext(MonitorContext);
    if (!ctx) throw new Error('MonitorContext not initialized');
    return ctx;
};
