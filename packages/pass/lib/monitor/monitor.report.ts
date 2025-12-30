import debounce from 'lodash/debounce';

import {
    selectDuplicatePasswords,
    selectExcludedItems,
    selectOwnedVaults,
    selectPassPlan,
} from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { B2BEvent } from '@proton/pass/types/data/b2b';
import { B2BEventName } from '@proton/pass/types/data/b2b';
import type { EventDispatcher } from '@proton/pass/utils/event/dispatcher';
import { prop } from '@proton/pass/utils/fp/lens';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { isBusinessPlan } from '../organization/helpers';
import type { MonitorService } from './service';

export const createMonitorReport = debounce(
    async ({
        state,
        monitor,
        dispatch,
    }: {
        state: State;
        monitor: MonitorService;
        dispatch: EventDispatcher<B2BEvent>['push'];
    }) => {
        try {
            if (!isBusinessPlan(selectPassPlan(state))) return;

            const shareIds = selectOwnedVaults(state).map(prop('shareId'));
            const reusedCount = selectDuplicatePasswords(shareIds)(state).length;
            const excludedCount = selectExcludedItems(shareIds)(state).length;
            const missing2FAs = await monitor.checkMissing2FAs({ shareIds });
            const weakPasswords = await monitor.checkWeakPasswords({ shareIds });

            await dispatch(
                {
                    name: B2BEventName.ReportMonitor,
                    timestamp: getEpoch(),
                    ExcludedItems: excludedCount,
                    ReusedPasswords: reusedCount,
                    Inactive2FA: missing2FAs.length,
                    WeakPasswords: weakPasswords.length,
                },
                { dedupeKey: 'name' }
            );
        } catch {}
    },
    5_000
);
