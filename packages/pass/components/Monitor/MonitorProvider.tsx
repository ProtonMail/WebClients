import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useInsecurePasswords } from '@proton/pass/hooks/monitor/useInsecurePasswords';
import { useMissing2FAs } from '@proton/pass/hooks/monitor/useMissing2FAs';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { getBreaches } from '@proton/pass/store/actions';
import { breachesRequest } from '@proton/pass/store/actions/requests';
import { selectDuplicatePasswords } from '@proton/pass/store/selectors/monitor';
import type { BreachesGetResponse, Maybe, MaybeNull, UniqueItem } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';

export type MonitorContextValue = {
    enabled: boolean;
    breaches: { data: Maybe<BreachesGetResponse>; count: number; loading: boolean };
    insecure: { data: UniqueItem[]; count: number };
    duplicates: { data: UniqueItem[][]; count: number };
    missing2FAs: { data: UniqueItem[]; count: number };
};

const MonitorContext = createContext<MaybeNull<MonitorContextValue>>(null);

export const MonitorProvider: FC<PropsWithChildren> = ({ children }) => {
    const enabled = useFeatureFlag(PassFeature.PassMonitor);
    const duplicates = useSelector(selectDuplicatePasswords);
    const missing2FAs = useMissing2FAs();
    const insecure = useInsecurePasswords();

    const breaches = useRequest(getBreaches, { initialRequestId: breachesRequest() });
    useEffect(() => breaches.revalidate(), []);

    const context = useMemo<MonitorContextValue>(
        () => ({
            enabled,
            breaches: { ...breaches, count: breaches.data?.EmailsCount ?? 0 },
            insecure,
            missing2FAs,
            duplicates: {
                data: duplicates,
                count: duplicates.reduce<number>((total, { length }) => total + length, 0),
            },
        }),
        [enabled, breaches, insecure, duplicates, missing2FAs]
    );
    return <MonitorContext.Provider value={context}>{children}</MonitorContext.Provider>;
};

export const useMonitor = (): MonitorContextValue => {
    const ctx = useContext(MonitorContext);
    if (!ctx) throw new Error('MonitorContext not initialized');
    return ctx;
};
