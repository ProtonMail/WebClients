import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { selectWritableVaults } from '@proton/pass/store/selectors/shares';
import { selectMostRecentVaultShareID } from '@proton/pass/store/selectors/vaults';

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
