import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import type { ExportedFile } from '@proton/pass/lib/export/types';
import { type ExportData, ExportFormat, type ExportedVault } from '@proton/pass/lib/export/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import { isB2BAdmin } from '@proton/pass/lib/organization/helpers';
import { isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { unwrapOptimisticState } from '@proton/pass/store/optimistic/utils/transformers';
import { selectShare } from '@proton/pass/store/selectors/shares';
import { selectPassPlan, selectUser } from '@proton/pass/store/selectors/user';
import type { State } from '@proton/pass/store/types';
import type { FileItemExport, MaybeNull } from '@proton/pass/types';
import { BitField } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';

import { SelectorError } from './errors';
import { selectOrganizationSettings } from './organization';

type ExportDataOptions = {
    config: PassConfig;
    format: ExportFormat;
    files: MaybeNull<FileItemExport>;
};

export const selectExportData =
    ({ config, format, files }: ExportDataOptions) =>
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
                const share = selectShare(shareId)(state);

                if (share && share.owner && isVaultShare(share)) {
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
                                shareCount: item.shareCount,
                                files: files?.[item.shareId]?.[item.itemId]?.map(prop('id')) ?? [],
                            })),
                        },
                    ]);
                }

                return shares;
            }, [])
        );

        return {
            encrypted: format === ExportFormat.EPEX,
            userId: user?.ID,
            vaults,
            version: config.APP_VERSION,
            files: files
                ? Object.values(files).reduce<ExportedFile[]>((acc, byItemID) => {
                      const files = Object.values(byItemID).flat();
                      acc.push(...files);
                      return acc;
                  }, [])
                : [],
        };
    };
