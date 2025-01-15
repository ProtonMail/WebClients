import { selectDuplicatePasswords, selectExcludedItems, selectPassPlan } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { B2BEvent } from '@proton/pass/types/data/b2b';
import { B2BEventName } from '@proton/pass/types/data/b2b';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import debounce from '@proton/utils/debounce';

import { isBusinessPlan } from '../organization/helpers';
import type { MonitorService } from './service';

export const sendMonitorReport = debounce(
    async ({
        state,
        monitor,
        onB2BEvent,
    }: {
        state: State;
        monitor: MonitorService;
        onB2BEvent: (event: B2BEvent) => void;
    }) => {
        if (!isBusinessPlan(selectPassPlan(state))) return;

        const reusedCount = selectDuplicatePasswords(state).length;
        const excludedCount = selectExcludedItems(state).length;
        const missing2FAs = await monitor.checkMissing2FAs();
        const weakPasswords = await monitor.checkWeakPasswords();

        onB2BEvent({
            name: B2BEventName.ReportMonitor,
            timestamp: getEpoch(),
            ExcludedItems: excludedCount,
            ReusedPasswords: reusedCount,
            Inactive2FA: missing2FAs.length,
            WeakPasswords: weakPasswords.length,
        });
    },
    5_000
);
