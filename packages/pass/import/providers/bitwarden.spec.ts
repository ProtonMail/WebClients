import fs from 'fs';

import type { ItemImportIntent } from '@proton/pass/types';

import { readBitwardenData } from './bitwarden.reader';

describe('Import bitwarden json', () => {
    let sourceData: string;

    beforeAll(async () => {
        sourceData = await fs.promises.readFile(__dirname + '/mocks/bitwarden.json', 'utf8');
    });

    it('should detect encrypted json payload', () => {
        expect(() => readBitwardenData(JSON.stringify({ encrypted: true, items: [] }))).toThrow();
    });

    it('should handle corrupted files', () => {
        expect(() => readBitwardenData('not-a-json-body')).toThrow();
        expect(() => readBitwardenData(JSON.stringify({ encrypted: false }))).toThrow();
        expect(() => readBitwardenData(JSON.stringify({ encrypted: false, items: '[]' }))).toThrow();
    });

    it('transforms bitwarden json into ImportPayload', () => {
        const payload = readBitwardenData(sourceData);
        const [vaultData] = payload;

        expect(payload.length).toEqual(1);
        expect(vaultData.type).toEqual('new');
        expect(vaultData.type === 'new' && vaultData.vaultName).not.toBeUndefined();

        const { items } = vaultData;

        /* Login */
        const loginItem = items[0] as ItemImportIntent<'login'>;
        const allowedApp = loginItem.platformSpecific?.android?.allowedApps[0];
        expect(loginItem.type).toBe('login');
        expect(loginItem.metadata.name).toBe('LoginItemMultipleWebsites');
        expect(loginItem.metadata.note).toBe('login note');
        expect(loginItem.content.username).toBe('username');
        expect(loginItem.content.password).toBe('password');
        expect(loginItem.content.urls[0]).toBe('https://test.url1/');
        expect(loginItem.content.urls[1]).toBe('https://test.url2/');
        expect(loginItem.content.totpUri).toBe(
            'otpauth://totp/proton:test?issuer=proton&secret=PROTON33&algorithm=SHA1&digits=6&period=30'
        );
        expect(allowedApp?.packageName).toEqual('ch.protonmail.android');
        expect(allowedApp?.hashes).toContain('ch.protonmail.android');

        /* Note */
        const noteItem = items[1] as ItemImportIntent<'note'>;
        expect(noteItem.type).toBe('note');
        expect(noteItem.metadata.name).toBe('NoteItem');
        expect(noteItem.metadata.note).toBe('note content');
        expect(noteItem.content).toStrictEqual({});
    });
});
