import { useMemo, useState } from 'react';

import type { FetchedBreaches } from '@proton/components/containers/credentialLeak/models';
import { BREACH_STATE } from '@proton/components/containers/credentialLeak/models';

export const useBreaches = () => {
    const [breaches, setBreaches] = useState<FetchedBreaches[]>([]);

    const updateBreachState = (breachId: string, state: BREACH_STATE) => {
        setBreaches((breaches) =>
            breaches.map((breach) => {
                if (breach.id === breachId) {
                    return { ...breach, resolvedState: state };
                }
                return breach;
            })
        );
    };

    const actions = useMemo(
        () => ({
            resolve: (breach: FetchedBreaches) => updateBreachState(breach.id, BREACH_STATE.RESOLVED),
            open: (breach: FetchedBreaches) => updateBreachState(breach.id, BREACH_STATE.READ),
            load: (breaches: FetchedBreaches[]) => setBreaches(breaches),
        }),
        []
    );

    return { breaches, actions };
};
