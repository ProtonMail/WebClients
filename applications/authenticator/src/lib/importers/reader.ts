import { readFile } from '@tauri-apps/plugin-fs';
import { extractQRCodeFromImage } from 'proton-authenticator/lib/importers/google';
import { ImportProvider } from 'proton-authenticator/lib/importers/types';
import { service } from 'proton-authenticator/lib/wasm/service';

export const prepareImport = (
    provider: ImportProvider,
    filename: string,
    contents: string | Uint8Array<ArrayBuffer>,
    password?: string
) => {
    if (contents instanceof Uint8Array) {
        switch (provider) {
            case ImportProvider.PROTON_PASS:
                return service.import_from_pass_zip(contents);
        }
    }

    if (typeof contents !== 'string') throw new Error('Content is not parseable');

    switch (provider) {
        case ImportProvider.TWOFAS:
            return service.import_from_2fas(contents, password);
        case ImportProvider.AEGIS:
            return filename.endsWith('txt')
                ? service.import_from_aegis_txt(contents)
                : service.import_from_aegis_json(contents, password);
        case ImportProvider.BITWARDEN:
            return filename.endsWith('csv')
                ? service.import_from_bitwarden_csv(contents)
                : service.import_from_bitwarden_json(contents);
        case ImportProvider.ENTE:
            return service.import_from_ente_txt(contents);
        case ImportProvider.LAST_PASS:
            return service.import_from_lastpass_json(contents);
        case ImportProvider.GOOGLE:
            return service.import_from_google_qr(contents);
        case ImportProvider.PROTON_AUTHENTICATOR:
            return password
                ? service.import_from_proton_authenticator_with_password(contents, password)
                : service.import_from_proton_authenticator(contents);
    }
};

export const getPathContent = async (
    provider: ImportProvider,
    path: string
): Promise<string | Uint8Array<ArrayBuffer>> => {
    const file = (await readFile(path)) as Uint8Array<ArrayBuffer>;
    switch (provider) {
        case ImportProvider.GOOGLE:
            return extractQRCodeFromImage(file);
        case ImportProvider.PROTON_PASS:
            return file;
        default:
            return new TextDecoder().decode(file);
    }
};
