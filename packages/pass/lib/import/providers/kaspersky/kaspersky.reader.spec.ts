import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import type { ItemImportIntent } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

import { readKasperskyData } from './kaspersky.reader';

describe('Import Kaspersky TXT', () => {
    let payload: ImportPayload;

    beforeAll(async () => {
        const sourceData = fs.readFileSync(__dirname + '/mocks/kaspersky.txt');
        const file = new File([sourceData], 'kaspersky.txt');
        payload = await readKasperskyData(file);
    });

    it('should correctly parse items', async () => {
        const [vaultData] = payload.vaults;

        expect(payload.vaults.length).toEqual(1);
        expect(vaultData.name).not.toBeUndefined();

        const { items } = vaultData;

        expect(items.length).toStrictEqual(8);

        /* Website item */
        const websiteItem = items[0] as ItemImportIntent<'login'>;
        expect(websiteItem.type).toEqual('login');
        expect(websiteItem.metadata.name).toEqual('Account title');
        expect(deobfuscate(websiteItem.metadata.note)).toEqual('my notes');
        expect(websiteItem.content.urls).toEqual(['https://example.com/']);
        expect(deobfuscate(websiteItem.content.itemEmail)).toEqual('');
        expect(deobfuscate(websiteItem.content.itemUsername)).toEqual('john');
        expect(deobfuscate(websiteItem.content.password)).toEqual('pass');

        /* Website item with email */
        const websiteItemEmail = items[1] as ItemImportIntent<'login'>;
        expect(websiteItemEmail.type).toEqual('login');
        expect(websiteItemEmail.metadata.name).toEqual('Account title 2');
        expect(deobfuscate(websiteItemEmail.metadata.note)).toEqual('');
        expect(websiteItemEmail.content.urls).toEqual(['https://example.com/']);
        expect(deobfuscate(websiteItemEmail.content.itemEmail)).toEqual('john2@example.com');
        expect(deobfuscate(websiteItemEmail.content.itemUsername)).toEqual('');
        expect(deobfuscate(websiteItemEmail.content.password)).toEqual('pass');

        /* Application item */
        const applicationItem = items[2] as ItemImportIntent<'login'>;
        expect(applicationItem.type).toEqual('login');
        expect(applicationItem.metadata.name).toEqual('Proton Pass.app App login');
        expect(deobfuscate(applicationItem.metadata.note)).toEqual('');
        expect(deobfuscate(applicationItem.content.itemEmail)).toEqual('');
        expect(deobfuscate(applicationItem.content.itemUsername)).toEqual('john');
        expect(deobfuscate(applicationItem.content.password)).toEqual('pass');

        /* Other Account item */
        const otherAccountItem = items[3] as ItemImportIntent<'login'>;
        expect(otherAccountItem.type).toEqual('login');
        expect(otherAccountItem.metadata.name).toEqual('New account');
        expect(deobfuscate(otherAccountItem.metadata.note)).toEqual('');
        expect(deobfuscate(otherAccountItem.content.itemEmail)).toEqual('');
        expect(deobfuscate(otherAccountItem.content.itemUsername)).toEqual('john2');
        expect(deobfuscate(otherAccountItem.content.password)).toEqual('');

        /* Other Account item 2 */
        const otherAccountItem2 = items[4] as ItemImportIntent<'login'>;
        expect(otherAccountItem2.type).toEqual('login');
        expect(otherAccountItem2.metadata.name).toEqual('New account');
        expect(deobfuscate(otherAccountItem2.metadata.note)).toEqual('');
        expect(deobfuscate(otherAccountItem2.content.itemEmail)).toEqual('');
        expect(deobfuscate(otherAccountItem2.content.itemUsername)).toEqual('john');
        expect(deobfuscate(otherAccountItem2.content.password)).toEqual('');

        /* Note item */
        const noteItem = items[5] as ItemImportIntent<'note'>;
        expect(noteItem.type).toEqual('note');
        expect(noteItem.metadata.name).toEqual('New note title');
        expect(deobfuscate(noteItem.metadata.note)).toEqual('');

        /* Note item with multiple lines */
        const noteItemMultipleLines = items[6] as ItemImportIntent<'note'>;
        expect(noteItemMultipleLines.type).toEqual('note');
        expect(noteItemMultipleLines.metadata.name).toEqual('New note title 2');
        expect(deobfuscate(noteItemMultipleLines.metadata.note)).toEqual('line 1\nline 2\nline 3",,,');

        expect(payload.ignored.length).toEqual(0);
        expect(payload.warnings.length).toEqual(0);

        /* Note item with multiple lines and possible properties */
        const noteItemMultipleLinesAndProperties = items[7] as ItemImportIntent<'note'>;
        expect(noteItemMultipleLinesAndProperties.type).toEqual('note');
        expect(noteItemMultipleLinesAndProperties.metadata.name).toEqual('Note 3');
        expect(deobfuscate(noteItemMultipleLinesAndProperties.metadata.note)).toEqual(
            'Props note\nLogin data on a multiline note:\n\nUsername: RiverPlate1\nPassword: hdwd823gahfb12!sopdf\nWEBSITE_NAME: https://amazing-website.com\nAPPLICATION: FiveStarsApp\n\nEnd of note'
        );

        expect(payload.ignored.length).toEqual(0);
        expect(payload.warnings.length).toEqual(0);
    });
});
