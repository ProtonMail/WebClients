import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import type { ExportData } from '@proton/pass/lib/export/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import { unwrapOptimisticState } from '@proton/pass/store/optimistic/utils/transformers';
import { selectShareOrThrow } from '@proton/pass/store/selectors/shares';
import { selectUser } from '@proton/pass/store/selectors/user';
import type { State } from '@proton/pass/store/types';
import type { ShareType } from '@proton/pass/types';

type ExportOptions = { config: PassConfig; encrypted: boolean };

export const selectExportData =
    ({ config, encrypted }: ExportOptions) =>
    (state: State): ExportData => {
        const itemsByShareId = unwrapOptimisticState(state.items.byShareId);
        const user = selectUser(state);

        const vaults = Object.fromEntries(
            Object.entries(itemsByShareId).map(([shareId, itemsById]) => {
                const share = selectShareOrThrow<ShareType.Vault>(shareId)(state);

                return [
                    shareId,
                    {
                        ...share.content,
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
            encrypted,
            userId: user?.ID,
            vaults,
            version: config.APP_VERSION,
        };
    };
