import { createExportZip, decryptZip, encryptZip } from '@proton/pass/lib/export/export';
import type { ExportPayload } from '@proton/pass/lib/export/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import { unwrapOptimisticState } from '@proton/pass/store/optimistic/utils/transformers';
import { selectShareOrThrow, selectUser } from '@proton/pass/store/selectors';
import { SessionLockStatus, type VaultShareContent, WorkerMessageType } from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import * as config from '../../config';
import WorkerMessageBroker from '../channel';
import { onContextReady } from '../context';
import store from '../store';

export const createExportService = () => {
    const getExportData = async (encrypted: boolean): Promise<ExportPayload> => {
        const state = store.getState();
        const itemsByShareId = unwrapOptimisticState(state.items.byShareId);
        const user = selectUser(state);

        const vaults = Object.fromEntries(
            Object.entries(itemsByShareId).map(([shareId, itemsById]) => {
                const share = selectShareOrThrow(shareId)(state);

                return [
                    shareId,
                    {
                        ...(share.content as VaultShareContent),
                        items: Object.values(itemsById).map((item) => ({
                            itemId: item.itemId,
                            shareId: item.shareId,
                            data: deobfuscateItem(item.data),
                            state: item.state,
                            aliasEmail: item.aliasEmail,
                            contentFormatVersion: item.contentFormatVersion,
                            createTime: item.createTime,
                            modifyTime: item.modifyTime,
                        })),
                    },
                ];
            })
        );

        return {
            version: config.APP_VERSION,
            userId: user?.ID,
            encrypted,
            vaults,
        };
    };

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.EXPORT_REQUEST,
        onContextReady(async (ctx, { payload }) => {
            const lock = await ctx.service.auth.checkLock();
            if (lock.status === SessionLockStatus.LOCKED) throw Error('Session locked');

            const exportData = await getExportData(payload.encrypted);
            const zip = await createExportZip(exportData);

            return {
                data: payload.encrypted ? await encryptZip(zip, payload.passphrase) : uint8ArrayToBase64String(zip),
            };
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.EXPORT_DECRYPT,
        async ({ payload: { data, passphrase } }) => ({ data: await decryptZip(data, passphrase) })
    );

    return {};
};

export type ExportService = ReturnType<typeof createExportService>;
