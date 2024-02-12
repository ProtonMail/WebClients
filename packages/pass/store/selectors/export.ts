import Papa from 'papaparse';

import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import { type ExportData, ExportFormat, type ExportedCsvItem, type ExportedVault } from '@proton/pass/lib/export/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import { unwrapOptimisticState } from '@proton/pass/store/optimistic/utils/transformers';
import { selectShare } from '@proton/pass/store/selectors/shares';
import { selectUser } from '@proton/pass/store/selectors/user';
import type { State } from '@proton/pass/store/types';
import type { ShareType } from '@proton/pass/types';

type ExportOptions = { config: PassConfig; format: ExportFormat };

type CompleteExportOptions = { state: State; config: PassConfig; encrypted: boolean };

const selectCompleteExportData = ({ state, config, encrypted }: CompleteExportOptions): ExportData => {
    const itemsByShareId = unwrapOptimisticState(state.items.byShareId);
    const user = selectUser(state);

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
        encrypted,
        userId: user?.ID,
        vaults,
        version: config.APP_VERSION,
    };
};

export const selectExportDataCSV = (state: State) => {
    const itemsByShareId = unwrapOptimisticState(state.items.byShareId);

    const exportedItems = Object.entries(itemsByShareId).reduce<ExportedCsvItem[]>((items, [shareId, itemsById]) => {
        const share = selectShare<ShareType.Vault>(shareId)(state);

        if (share && share.owner) {
            Object.values(itemsById).forEach((item) => {
                const data = deobfuscateItem(item.data);

                let username = '';
                switch (data.type) {
                    case 'login':
                        username = data.content.username;
                        break;
                    case 'alias':
                        username = item.aliasEmail ?? '';
                        break;
                    default:
                        username = '';
                }

                items.push({
                    type: data.type,
                    name: data.metadata.name,
                    url: 'urls' in data.content ? data.content.urls.join(', ') : '',
                    username,
                    password: 'password' in data.content ? data.content.password : '',
                    note:
                        data.type === 'creditCard'
                            ? JSON.stringify({ ...data.content, note: data.metadata.note })
                            : data.metadata.note,
                    totp: 'totpUri' in data.content ? data.content.totpUri : '',
                    createTime: item.createTime.toString(),
                    modifyTime: item.modifyTime.toString(),
                });
            });
        }

        return items;
    }, []);

    return Papa.unparse(exportedItems);
};

export const selectExportData =
    ({ config, format }: ExportOptions) =>
    (state: State) => {
        switch (format) {
            case ExportFormat.CSV:
                return selectExportDataCSV(state);
            default:
                return selectCompleteExportData({ state, config, encrypted: format === ExportFormat.ENCRYPTED });
        }
    };
