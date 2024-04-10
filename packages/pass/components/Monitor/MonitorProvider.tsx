import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo } from 'react';

import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { getBreaches } from '@proton/pass/store/actions';
import { breachesRequest } from '@proton/pass/store/actions/requests';
import type { BreachesGetResponse, Maybe } from '@proton/pass/types';

export type MonitorContextValue = {
    breaches: {
        data: Maybe<BreachesGetResponse>;
        loading: boolean;
    };
};

const MonitorContext = createContext<MonitorContextValue>({
    breaches: { data: undefined, loading: true },
});

export const MonitorProvider: FC<PropsWithChildren> = ({ children }) => {
    const breaches = useRequest(getBreaches, { initialRequestId: breachesRequest() });
    useEffect(() => breaches.revalidate(), []);

    const context = useMemo<MonitorContextValue>(() => ({ breaches }), [breaches]);
    return <MonitorContext.Provider value={context}>{children}</MonitorContext.Provider>;
};

export const useMonitor = () => useContext(MonitorContext);
