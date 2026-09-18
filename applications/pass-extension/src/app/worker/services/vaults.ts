import { selectFolders } from '@proton/pass/store/selectors/folders';
import { selectWritableVaults } from '@proton/pass/store/selectors/shares';
import { selectFeatureFlag, selectUserFolderAllowed } from '@proton/pass/store/selectors/user';
import { selectMostRecentVaultShareID } from '@proton/pass/store/selectors/vaults';
import { PassFeature } from '@proton/pass/types/api/features';
import { objectFilter } from '@proton/pass/utils/object/filter';

import { WorkerMessageType } from '../../../types/messages';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context/inject';

export const createVaultsService = () => {
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.VAULTS_QUERY,
        withContext((ctx) => {
            const state = ctx.service.store.getState();
            const canUseFolders =
                selectFeatureFlag(PassFeature.PassFolder)(state) && Boolean(selectUserFolderAllowed(state));

            const vaults = selectWritableVaults(state);
            const writableShareIds = new Set(vaults.map(({ shareId }) => shareId));

            return {
                defaultShareId: selectMostRecentVaultShareID(state) ?? '',
                vaults,
                folders: canUseFolders
                    ? objectFilter(selectFolders(state), (shareId) => writableShareIds.has(shareId))
                    : {},
                canUseFolders,
            };
        })
    );

    return {};
};

export type VaultsService = ReturnType<typeof createVaultsService>;
