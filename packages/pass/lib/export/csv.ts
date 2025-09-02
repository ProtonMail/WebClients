import { prop } from '@proton/pass/utils/fp/lens';

import type { ExportCSVItem } from './types';
import type { ExportData } from './types';

const EXPORT_AS_JSON_TYPES = ['creditCard', 'identity'];

/** FIXME: ideally we should also support exporting
 * `extraFields` to notes when exporting to CSV */
export const createPassExportCSV = async (payload: ExportData): Promise<Blob> => {
    const Papa = (await import(/* webpackChunkName: "csv.reader" */ 'papaparse')).default;

    const items = Object.values(payload.vaults)
        .flatMap(prop('items'))
        .map<ExportCSVItem>(({ data, aliasEmail, createTime, modifyTime, shareId }) => ({
            type: data.type,
            name: data.metadata.name,
            url: 'urls' in data.content ? data.content.urls.join(', ') : '',
            email: (() => {
                switch (data.type) {
                    case 'login':
                        return data.content.itemEmail;
                    case 'alias':
                        return aliasEmail ?? '';
                    default:
                        return '';
                }
            })(),
            username: data.type === 'login' ? data.content.itemUsername : '',
            password: 'password' in data.content ? data.content.password : '',
            note: EXPORT_AS_JSON_TYPES.includes(data.type)
                ? JSON.stringify({ ...data.content, note: data.metadata.note })
                : data.metadata.note,
            totp: 'totpUri' in data.content ? data.content.totpUri : '',
            createTime: createTime.toString(),
            modifyTime: modifyTime.toString(),
            vault: payload.vaults[shareId].name,
        }));

    const csv = Papa.unparse(items);
    return new Blob([csv]);
};
