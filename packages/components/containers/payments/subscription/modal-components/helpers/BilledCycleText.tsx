import { useMemo } from 'react';

import { c } from 'ttag';

import { CYCLE, type Cycle, type PlanIDs, getRenewCycle } from '@proton/payments';

export const BilledCycleText = ({ cycle, planIDs }: { cycle: Cycle; planIDs: PlanIDs }) => {
    const renewCycle = getRenewCycle(planIDs, cycle);

    const text = useMemo(() => {
        if (cycle !== renewCycle) {
            return null;
        }

        switch (cycle) {
            case CYCLE.TWO_YEARS:
                return c('Subscription').t`Billed every 2 years`;
            case CYCLE.YEARLY:
                return c('Subscription').t`Billed yearly`;
            case CYCLE.MONTHLY:
                return c('Subscription').t`Billed monthly`;

            // It's safer to display null because the irregular cycles are usually renewed at regular cycles.
            case CYCLE.SIX:
            case CYCLE.THREE:
            case CYCLE.FIFTEEN:
            case CYCLE.EIGHTEEN:
            case CYCLE.THIRTY:
                return null;
        }
    }, [cycle, renewCycle]);

    return (
        <span className="color-weak text-sm" data-testid="billed-cycle-text">
            {text}
        </span>
    );
};
