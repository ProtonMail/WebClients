import { selectWritableVaults } from '@proton/pass/store/selectors/shares';
import { selectMostRecentVaultShareID } from '@proton/pass/store/selectors/vaults';

import { WorkerMessageType } from '../../../types/messages';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context/inject';

export const createVaultsService = () => {
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.VAULTS_QUERY,
        withContext((ctx) => {
            const state = ctx.service.store.getState();

            return {
                defaultShareId: selectMostRecentVaultShareID(state) ?? '',
                vaults: selectWritableVaults(state),
            };
        })
    );

    return {};
};

export type VaultsService = ReturnType<typeof createVaultsService>;
