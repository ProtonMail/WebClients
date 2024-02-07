import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import type { ExportData, ExportedItem } from '@proton/pass/lib/export/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import { unwrapOptimisticState } from '@proton/pass/store/optimistic/utils/transformers';
import { selectShareOrThrow } from '@proton/pass/store/selectors/shares';
import { selectUser } from '@proton/pass/store/selectors/user';
import type { State } from '@proton/pass/store/types';
import type { ShareType, VaultShareContent } from '@proton/pass/types';

type ExportOptions = { config: PassConfig; encrypted: boolean };

type ExportedVault = [
    string,
    VaultShareContent & {
        items: ExportedItem[];
    },
];

export const selectExportData =
    ({ config, encrypted }: ExportOptions) =>
    (state: State): ExportData => {
        const itemsByShareId = unwrapOptimisticState(state.items.byShareId);
        const user = selectUser(state);

        const vaults = Object.fromEntries(
            Object.entries(itemsByShareId).reduce<ExportedVault[]>((shares, [shareId, itemsById]) => {
                const share = selectShareOrThrow<ShareType.Vault>(shareId)(state);

                if (share.owner) {
                    shares.push([
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
                                pinned: item.pinned,
                            })),
                        },
                    ]);
                }
                return shares;
            }, [])
        );

        return {
            encrypted,
            userId: user?.ID,
            vaults,
            version: config.APP_VERSION,
        };
    };
