import { prop } from '../../utils/fp/lens';
import { getDefaultModeUrls } from '../urls/utils/autofill';
import type { ExportCSVItem, ExportData } from './types';

const EXPORT_AS_JSON_TYPES = ['creditCard', 'identity'];

/** FIXME: ideally we should also support exporting
 * `extraFields` to notes when exporting to CSV */
export const createPassExportCSV = async (payload: ExportData): Promise<Blob> => {
    const Papa = (await import(/* webpackChunkName: "csv.reader" */ 'papaparse')).default;

    const items = Object.values(payload.vaults)
        .flatMap(prop('items'))
        .map<ExportCSVItem>(({ data, aliasEmail, createTime, modifyTime, shareId }) => {
            const autofillUrls = 'autofillUrls' in data.content ? data.content.autofillUrls : [];

            return {
                type: data.type,
                name: data.metadata.name,
                url: getDefaultModeUrls(autofillUrls).join(', '),
                /** Emit the structured column whenever there's at least one url, empty only
                 * for rows with none (credit-card/identity/note, or a login with no urls). */
                autofillUrls: autofillUrls.length ? JSON.stringify(autofillUrls) : '',
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
            };
        });

    const csv = Papa.unparse(items);
    return new Blob([csv]);
};
