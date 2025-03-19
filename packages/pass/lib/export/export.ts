import JSZip from 'jszip';
import Papa from 'papaparse';

import { CryptoProxy } from '@proton/crypto';
import { prop } from '@proton/pass/utils/fp/lens';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import type { ExportCSVItem, ExportedFile } from './types';
import { type ExportData, ExportFormat, type ExportOptions } from './types';

const EXPORT_AS_JSON_TYPES = ['creditCard', 'identity'];

export const EXPORT_FILES_PATH = `${PASS_APP_NAME}/files/`;

/** Rebuild the File from ArrayBuffer */
export const createFileFromArrayBuffer = ({ content, fileName, mimeType }: ExportedFile): File => {
    const blob = new Blob([content], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
};

/** Exporting data from the extension uses the .zip format
 * for future-proofing : we will support integrating additional
 * files when exporting */
export const createPassExportZip = async ({ files, ...payload }: ExportData): Promise<Uint8Array> => {
    const zip = new JSZip();
    zip.file(`${PASS_APP_NAME}/data.json`, JSON.stringify(payload));
    files.forEach((file) => zip.file(`${EXPORT_FILES_PATH}${file.fileName}`, createFileFromArrayBuffer(file)));
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
    (
        await CryptoProxy.encryptMessage({
            binaryData: data,
            passwords: [passphrase],
            config: { s2kIterationCountByte: 255 },
            format: 'armored',
        })
    ).message;

export const decryptPassExport = async (blob: Blob, passphrase: string): Promise<Uint8Array> => {
    const buffer = await blob.arrayBuffer();

    return (
        await CryptoProxy.decryptMessage({
            armoredMessage: new TextDecoder().decode(buffer),
            passwords: [passphrase],
            format: 'binary',
        })
    ).data;
};

const getMimeType = (format: ExportFormat) => {
    switch (format) {
        case ExportFormat.ZIP:
        case ExportFormat.PEX:
            return 'application/zip';
        case ExportFormat.EPEX:
        case ExportFormat.PGP:
            return 'application/pgp-encrypted';
        case ExportFormat.CSV:
            return 'text/csv;charset=utf-8;';
    }
};

export const createPassExport = async (payload: ExportData, options: ExportOptions): Promise<File> => {
    const type = getMimeType(options.format);
    const timestamp = new Date().toISOString().split('T')[0];
    const name = `${PASS_APP_NAME}_export_${timestamp}.${options.format}`;

    switch (options.format) {
        case ExportFormat.ZIP:
        case ExportFormat.PEX:
            return new File([await createPassExportZip(payload)], name, { type });
        case ExportFormat.EPEX:
        case ExportFormat.PGP:
            return new File([await encryptPassExport(await createPassExportZip(payload), options.passphrase)], name, {
                type,
            });
        case ExportFormat.CSV:
            return new File([createPassExportCSV(payload)], name, { type });
    }
};
