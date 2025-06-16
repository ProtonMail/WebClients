import JSZip from 'jszip';

import type { ItemImportIntent } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { readBitwardenArchiveData } from './bitwarden.archive.reader';

const createBitwardenLoginItem = () => ({
    id: `test-uuid-${uniqueId()}`,
    name: `Login#${uniqueId()}`,
    type: 1,
    login: { username: uniqueId(), password: uniqueId() },
});

const LOGIN_1 = createBitwardenLoginItem();
const LOGIN_2 = createBitwardenLoginItem();

describe('readBitwardenArchiveData', () => {
    const createBitwardenArchive = async () => {
        const zip = new JSZip();

        const data = {
            encrypted: false,
            folders: [],
            items: [LOGIN_1, LOGIN_2],
        };

        zip.file('data.json', JSON.stringify(data));
        zip.folder('attachments');
        zip.folder(`attachments/${LOGIN_1.id}`);
        zip.folder(`attachments/${LOGIN_2.id}`);
        zip.file(`attachments/${LOGIN_1.id}/document.pdf`, 'PDF');
        zip.file(`attachments/${LOGIN_1.id}/image.jpg`, 'IMG');
        zip.file(`attachments/${LOGIN_2.id}/doc.docx`, 'DOC');

        const blob = await zip.generateAsync({ type: 'blob' });
        return new File([blob], 'bitwarden-export.zip', { type: 'application/zip' });
    };

    test('should process bitwarden archives successfully and attach file attachments', async () => {
        const zipFile = await createBitwardenArchive();
        const result = await readBitwardenArchiveData(zipFile);

        expect(result).toBeDefined();
        expect(result.fileReader).toBeDefined();
        expect(result.vaults).toBeDefined();

        const [item1, item2] = result.vaults[0].items as ItemImportIntent<'login'>[];

        expect(item1.metadata.name).toEqual(LOGIN_1.name);
        expect(item1.type).toEqual('login');
        expect(deobfuscate(item1.content.itemUsername)).toEqual(LOGIN_1.login.username);
        expect(deobfuscate(item1.content.password)).toEqual(LOGIN_1.login.password);
        expect(item1.files).toEqual([`attachments/${LOGIN_1.id}/document.pdf`, `attachments/${LOGIN_1.id}/image.jpg`]);

        expect(item2.metadata.name).toEqual(LOGIN_2.name);
        expect(item2.type).toEqual('login');
        expect(deobfuscate(item2.content.itemUsername)).toEqual(LOGIN_2.login.username);
        expect(deobfuscate(item2.content.password)).toEqual(LOGIN_2.login.password);
        expect(item2.files).toEqual([`attachments/${LOGIN_2.id}/doc.docx`]);

        result.fileReader?.close();
    });

    test('should handle missing data.json', async () => {
        const zip = new JSZip();
        zip.file('other.json', '{}');
        const blob = await zip.generateAsync({ type: 'blob' });
        const zipFile = new File([blob], 'invalid.zip', { type: 'application/zip' });

        await expect(readBitwardenArchiveData(zipFile)).rejects.toThrow();
    });
});
