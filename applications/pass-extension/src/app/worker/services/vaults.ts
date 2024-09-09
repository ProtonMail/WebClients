import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';

import { selectMostRecentVault, selectWritableVaults } from '@proton/pass/store/selectors';
import { WorkerMessageType } from '@proton/pass/types';

export const createVaultsService = () => {
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.VAULTS_QUERY,
        withContext((ctx) => {
            const state = ctx.service.store.getState();
            return {
                vaults: selectWritableVaults(state),
                defaultShareId: selectMostRecentVault(state),
            };
        })
    );

    return {};
};

export type VaultsService = ReturnType<typeof createVaultsService>;
