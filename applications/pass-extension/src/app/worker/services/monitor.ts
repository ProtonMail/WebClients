import type { Store } from 'redux';

import type { PassCoreProxy } from '@proton/pass/lib/core/core.types';
import { createMonitorService as createCoreMonitorService } from '@proton/pass/lib/monitor/service';
import { selectItem } from '@proton/pass/store/selectors/items';
import type { ItemRevision, UniqueItem } from '@proton/pass/types/data/items';

import { WorkerMessageType } from '../../../types/messages';
import WorkerMessageBroker from '../channel';

const resolveMonitorCheckForItem =
    (store: Store, check: (revision: ItemRevision) => Promise<boolean>) =>
    async ({ shareId, itemId }: UniqueItem) => {
        const revision = selectItem(shareId, itemId)(store.getState());
        if (!revision) return false;

        return check(revision);
    };

export const createMonitorService = (core: PassCoreProxy, store: Store) => {
    const service = createCoreMonitorService(core, store);

    WorkerMessageBroker.registerMessage(WorkerMessageType.MONITOR_2FAS, async () => ({
        result: await service.checkMissing2FAs(),
    }));

    WorkerMessageBroker.registerMessage(WorkerMessageType.MONITOR_MISSING_2FA_FOR_ITEM, async ({ payload }) => ({
        result: await resolveMonitorCheckForItem(store, service.checkMissing2FAForItem)(payload),
    }));

    WorkerMessageBroker.registerMessage(WorkerMessageType.MONITOR_WEAK_PASSWORDS, async () => ({
        result: await service.checkWeakPasswords(),
    }));

    WorkerMessageBroker.registerMessage(WorkerMessageType.MONITOR_WEAK_PASSWORD_FOR_ITEM, async ({ payload }) => ({
        result: await resolveMonitorCheckForItem(store, service.checkWeakPasswordForItem)(payload),
    }));

    return service;
};
