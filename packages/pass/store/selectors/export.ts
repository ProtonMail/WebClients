import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import { type ExportData, ExportFormat, type ExportedVault } from '@proton/pass/lib/export/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import { isB2BAdmin } from '@proton/pass/lib/organization/helpers';
import { unwrapOptimisticState } from '@proton/pass/store/optimistic/utils/transformers';
import { selectShare } from '@proton/pass/store/selectors/shares';
import { selectPassPlan, selectUser } from '@proton/pass/store/selectors/user';
import type { State } from '@proton/pass/store/types';
import { BitField, type ShareType } from '@proton/pass/types';

import { SelectorError } from './errors';
import { selectOrganizationSettings } from './organization';

export const selectExportData =
    ({ config, format }: { config: PassConfig; format: ExportFormat }) =>
    (state: State): ExportData => {
        const user = selectUser(state);
        const plan = selectPassPlan(state);
        const orgSettings = selectOrganizationSettings(state);
        const b2bAdmin = user ? isB2BAdmin(user, plan) : false;
        const orgExportDisabled = orgSettings?.ExportMode === BitField.ACTIVE;

        /** Safe-guard export data selector against organization exporting policies */
        const exportDisabled = !b2bAdmin && orgExportDisabled;
        if (exportDisabled) throw new SelectorError('Export disabled for org members');

        const itemsByShareId = unwrapOptimisticState(state.items.byShareId);

        const vaults = Object.fromEntries(
            Object.entries(itemsByShareId).reduce<[string, ExportedVault][]>((shares, [shareId, itemsById]) => {
                const share = selectShare<ShareType.Vault>(shareId)(state);

                if (share && share.owner) {
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
            encrypted: format === ExportFormat.PGP,
            userId: user?.ID,
            vaults,
            version: config.APP_VERSION,
        };
    };
