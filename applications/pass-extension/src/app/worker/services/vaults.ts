import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';

import { selectMostRecentVaultShareID, selectWritableVaults } from '@proton/pass/store/selectors';
import { WorkerMessageType } from '@proton/pass/types';

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
