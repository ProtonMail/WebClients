import JSZip from 'jszip';

import { CryptoProxy } from '@proton/crypto';
import { decodeBase64, encodeBase64 } from '@proton/crypto/lib/utils';
import type { TransferableFile } from '@proton/pass/utils/file/transferable-file';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import type { ExportData, ExportOptions } from './types';

/** Exporting data from the extension uses the .zip format
 * for future-proofing : we will support integrating additional
 * files when exporting */
export const createPassExportZip = async (payload: ExportData): Promise<Uint8Array> => {
    const zip = new JSZip();
    zip.file(`${PASS_APP_NAME}/data.json`, JSON.stringify(payload));
    return zip.generateAsync({ type: 'uint8array' });
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

/** If data is encrypted, will export as PGP file instead of a ZIP.
 * Returns a `TransferableFile` in case the data must be passed around
 * different contexts (ie: from extension component to service worker) */
export const createPassExport = async (payload: ExportData, options: ExportOptions): Promise<TransferableFile> => {
    const encrypted = options.encrypted;
    const zip = await createPassExportZip(payload);

    const base64 = encrypted ? await encryptPassExport(zip, options.passphrase) : uint8ArrayToBase64String(zip);
    const type = encrypted ? 'data:text/plain;charset=utf-8;' : 'application/zip';
    const timestamp = new Date().toISOString().split('T')[0];
    const name = `${PASS_APP_NAME}_export_${timestamp}.${encrypted ? 'pgp' : 'zip'}`;

    return { base64, name, type };
};
