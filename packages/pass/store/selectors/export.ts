import type { PassConfig } from '../../hooks/usePassConfig';
import type { ExportData, ExportedVault } from '../../lib/export/types';
import { getExportFileName } from '../../lib/file-attachments/helpers';
import { deobfuscateItem } from '../../lib/items/item.obfuscation';
import { isB2BAdmin } from '../../lib/organization/helpers';
import { isVaultShare } from '../../lib/shares/share.predicates';
import { getDefaultModeUrls } from '../../lib/urls/utils/autofill';
import type { DeobfuscatedItem, FileDescriptor, IndexedByShareIdAndItemId } from '../../types';
import { OrganizationExportMode } from '../../types';
import { unwrapOptimisticState } from '../optimistic/utils/transformers';
import type { State } from '../types';
import { SelectorError } from './errors';
import { selectOrganizationSettings } from './organization';
import { selectShare } from './shares';
import { selectPassPlan, selectUser } from './user';

export type ExportThunk = (files: IndexedByShareIdAndItemId<FileDescriptor[]>) => ExportData;

/** Mirrors loginContentToProtobuf: `autofillUrls` holds the full set of modes while the
 * legacy `urls` field duplicates only the `Default`-mode urls so old importers can still
 * read them without misinterpreting another mode as `Default`. */
const toExportItem = (data: DeobfuscatedItem): DeobfuscatedItem => {
    if (data.type !== 'login') return data;
    const { autofillUrls } = data.content;
    return {
        ...data,
        content: {
            ...data.content,
            urls: getDefaultModeUrls(autofillUrls),
            autofillUrls,
        },
    } as unknown as DeobfuscatedItem;
};

export const selectExportData =
    (config: PassConfig) =>
    (state: State): ExportThunk => {
        const user = selectUser(state);
        const plan = selectPassPlan(state);
        const orgSettings = selectOrganizationSettings(state);
        const b2bAdmin = user ? isB2BAdmin(user, plan) : false;
        const orgExportDisabled = orgSettings?.ExportMode === OrganizationExportMode.ONLYADMINS;

        /** Safe-guard export data selector against organization exporting policies */
        const exportDisabled = !b2bAdmin && orgExportDisabled;
        if (exportDisabled) throw new SelectorError('Export disabled for org members');

        const itemsByShareId = unwrapOptimisticState(state.items.byShareId);

        return (files) => {
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
                                    data: toExportItem(deobfuscateItem(item.data)),
                                    state: item.state,
                                    aliasEmail: item.aliasEmail,
                                    contentFormatVersion: item.contentFormatVersion,
                                    createTime: item.createTime,
                                    modifyTime: item.modifyTime,
                                    pinned: item.pinned,
                                    shareCount: item.shareCount,
                                    files: files?.[shareId]?.[item.itemId]?.map(getExportFileName(shareId)) ?? [],
                                })),
                            },
                        ]);
                    }

                    return shares;
                }, [])
            );

            return {
                userId: user?.ID,
                vaults,
                version: config.APP_VERSION,
            };
        };
    };
