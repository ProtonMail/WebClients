import JSZip from 'jszip';
import Papa from 'papaparse';

import { CryptoProxy } from '@proton/crypto';
import { decodeBase64, encodeBase64, encodeUtf8Base64 } from '@proton/crypto/lib/utils';
import type { TransferableFile } from '@proton/pass/utils/file/transferable-file';
import { prop } from '@proton/pass/utils/fp/lens';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import type { ExportCSVItem } from './types';
import { type ExportData, ExportFormat, type ExportOptions } from './types';

const EXPORT_AS_JSON_TYPES = ['creditCard', 'identity'];

/** Exporting data from the extension uses the .zip format
 * for future-proofing : we will support integrating additional
 * files when exporting */
export const createPassExportZip = async (payload: ExportData): Promise<Uint8Array> => {
    const zip = new JSZip();
    zip.file(`${PASS_APP_NAME}/data.json`, JSON.stringify(payload));
    return zip.generateAsync({ type: 'uint8array' });
};

/** FIXME: ideally we should also support exporting
 * `extraFields` to notes when exporting to CSV */
export const createPassExportCSV = (payload: ExportData): string => {
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

    return Papa.unparse(items);
};

/**
 * Encrypts an `Uint8Array` representation of an export zip to a base64.
 * Once support for argon2 is released, then we should pass a config to use
 * that instead - as long as the export feature is alpha, it’s okay to release
 * without argon2, but let’s pass config: { s2kIterationCountByte: 255 } to
 * encryptMessage with the highest security we have atm */
export const encryptPassExport = async (data: Uint8Array, passphrase: string): Promise<string> =>
    encodeBase64(
        (
            await CryptoProxy.encryptMessage({
                binaryData: data,
                passwords: [passphrase],
                config: { s2kIterationCountByte: 255 },
                format: 'armored',
            })
        ).message
    );

export const decryptPassExport = async (base64: string, passphrase: string): Promise<Uint8Array> =>
    (
        await CryptoProxy.decryptMessage({
            armoredMessage: decodeBase64(base64),
            passwords: [passphrase],
            format: 'binary',
        })
    ).data;

const getMimeType = (format: ExportFormat) => {
    switch (format) {
        case ExportFormat.ZIP:
            return 'application/zip';
        case ExportFormat.PGP:
            return 'application/pgp-encrypted';
        case ExportFormat.CSV:
            return 'text/csv;charset=utf-8;';
    }
};

const createBase64Export = async (payload: ExportData, options: ExportOptions): Promise<string> => {
    switch (options.format) {
        case ExportFormat.ZIP:
            return uint8ArrayToBase64String(await createPassExportZip(payload));
        case ExportFormat.PGP:
            return encryptPassExport(await createPassExportZip(payload), options.passphrase);
        case ExportFormat.CSV:
            return encodeUtf8Base64(createPassExportCSV(payload));
    }
};

/** If data is encrypted, will export as PGP file instead of a ZIP.
 * Returns a `TransferableFile` in case the data must be passed around
 * different contexts (ie: from extension component to service worker) */
export const createPassExport = async (payload: ExportData, options: ExportOptions): Promise<TransferableFile> => {
    const base64 = await createBase64Export(payload, options);
    const type = getMimeType(options.format);
    const timestamp = new Date().toISOString().split('T')[0];
    const name = `${PASS_APP_NAME}_export_${timestamp}.${options.format}`;

    return { base64, name, type };
};
