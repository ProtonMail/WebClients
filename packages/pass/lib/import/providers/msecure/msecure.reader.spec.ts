import fs from 'fs';

import type { ItemImportIntent } from '../../../../types/data/items.dto';
import { AutofillMode } from '../../../../types/protobuf';
import * as epochUtils from '../../../../utils/time/epoch';
import { deobfuscateItem } from '../../../items/item.obfuscation';
import type { ImportPayload } from '../../types';
import { readMSecureData } from './msecure.reader';

jest.mock('@proton/pass/utils/time/epoch', () => ({
    ...jest.requireActual('@proton/pass/utils/time/epoch'),
    getEpoch: jest.fn(),
}));

describe('Import mSecure csv', () => {
    let payload: ImportPayload;
    const dateMock = jest.mocked(epochUtils.getEpoch).mockImplementation(() => 1682585156);

    const getItem = <T extends ItemImportIntent['type']>(index: number) =>
        deobfuscateItem(payload.vaults[0].items[index]) as unknown as ItemImportIntent<T>;

    beforeAll(async () => {
        const sourceData = fs.readFileSync(__dirname + '/mocks/msecure.csv');
        payload = await readMSecureData(new File([sourceData], 'msecure.csv'));
    });

    afterAll(() => dateMock.mockRestore());

    it('should throw on corrupted files', async () => {
        await expect(readMSecureData(new File([], 'corrupted'))).rejects.toThrow();
    });

    it('should import into a single vault', () => {
        const [vault] = payload.vaults;
        expect(payload.vaults.length).toEqual(1);
        expect(vault.name).toEqual('Import - Apr 27, 2023');
        expect(vault.items.length).toEqual(7);
        expect(payload.ignored).toEqual([]);
        expect(payload.warnings).toEqual([]);
    });

    it('parses a login', () => {
        const item = getItem<'login'>(0);
        expect(item.type).toEqual('login');
        expect(item.metadata.name).toEqual('Bitwarden');
        expect(item.metadata.note).toEqual('');
        expect(item.content.itemUsername).toEqual('bitwarden user');
        expect(item.content.password).toEqual('bitpassword');
        expect(item.content.autofillUrls).toEqual([{ url: 'https://bitwarden.com/', mode: AutofillMode.Default }]);
        expect(item.extraFields).toEqual([]);
    });

    it('keeps `|` inside values', () => {
        const item = getItem<'login'>(1);
        expect(item.metadata.name).toEqual('Example');
        expect(item.metadata.note).toEqual('This is a note |');
        expect(item.content.itemUsername).toEqual('username || lol');
        expect(item.content.password).toEqual('this is a password');
    });

    it('turns the tag into a folder', () => {
        const [vault] = payload.vaults;
        expect(vault.folders.map(({ name, parentId }) => [name, parentId])).toEqual([['tag holding it', null]]);

        const folderId = vault.folders[0].id;
        expect(vault.items.filter((item) => item.folderId === folderId).map((i) => i.metadata.name)).toEqual([
            'Website with a tag',
        ]);
        expect(vault.items.filter((item) => item.folderId === null).length).toEqual(6);
    });

    it('parses a web login with notes, secrets and extra websites', () => {
        const item = getItem<'login'>(3);
        expect(item.type).toEqual('login');
        expect(item.metadata.note).toEqual('Line one\nLine two');
        expect(item.content.itemEmail).toEqual('user@proton.me');
        expect(item.content.itemUsername).toEqual('');
        expect(item.content.autofillUrls).toEqual([
            { url: 'https://proton.me/', mode: AutofillMode.Default },
            { url: 'https://proton.me/login', mode: AutofillMode.Default },
        ]);
        expect(item.extraFields).toEqual([{ fieldName: 'Recovery Code', type: 'hidden', data: { content: 'abc123' } }]);
    });

    it('parses a credit card', () => {
        const item = getItem<'creditCard'>(4);
        expect(item.type).toEqual('creditCard');
        expect(item.metadata.name).toEqual('myCreditCard');
        expect(item.content.number).toEqual('41111111111111111');
        expect(item.content.expirationDate).toEqual('052026');
        expect(item.content.verificationNumber).toEqual('123');
        expect(item.content.cardholderName).toEqual('John Doe');
        expect(item.content.pin).toEqual('1234');
        expect(item.extraFields).toEqual([{ fieldName: 'Issuing Bank', type: 'text', data: { content: 'Visa' } }]);
    });

    it('parses an old style credit card', () => {
        const item = getItem<'creditCard'>(5);
        expect(item.metadata.note).toEqual('Security code 1234');
        expect(item.content.number).toEqual('5555 4444 3333 2222');
        expect(item.content.expirationDate).toEqual('042029');
        expect(item.content.verificationNumber).toEqual('444');
        expect(item.content.cardholderName).toEqual('Obi Wan Kenobi');
    });

    it('imports unknown templates as notes', () => {
        const item = getItem<'note'>(6);
        expect(item.type).toEqual('note');
        expect(item.metadata.name).toEqual('Wifi');
        expect(item.metadata.note).toEqual('Router password inside');
        expect(item.extraFields).toEqual([
            { fieldName: 'Account', type: 'text', data: { content: 'home' } },
            { fieldName: 'Key', type: 'hidden', data: { content: 's3cret' } },
        ]);
    });

    it('skips the mSecure 6 header line', async () => {
        const data = 'mSecure6 CSV export file\nNetflix|471579544,Login,,,Website|2|netflix.com,Password|8|pw,\n';
        const { vaults, ignored } = await readMSecureData(new File([data], 'msecure.csv'));
        const [item] = vaults[0].items.map((item) => deobfuscateItem(item) as unknown as ItemImportIntent<'login'>);

        expect(vaults[0].items.length).toEqual(1);
        expect(ignored).toEqual([]);
        expect(item.type).toEqual('login');
        expect(item.metadata.name).toEqual('Netflix');
        expect(item.content.password).toEqual('pw');
    });
});

describe('Import mSecure csv (French app export)', () => {
    let items: ItemImportIntent[];

    const getItem = <T extends ItemImportIntent['type']>(name: string) =>
        deobfuscateItem(items.find((item) => item.metadata.name === name)!) as unknown as ItemImportIntent<T>;

    beforeAll(async () => {
        jest.mocked(epochUtils.getEpoch).mockImplementation(() => 1682585156);
        const sourceData = fs.readFileSync(__dirname + '/mocks/msecure-fr.csv');
        const payload = await readMSecureData(new File([sourceData], 'msecure-fr.csv'));
        items = payload.vaults[0].items;
        expect(payload.ignored).toEqual([]);
        expect(payload.warnings).toEqual([]);
    });

    it('skips the header line and imports every row', () => {
        expect(items.map(({ metadata }) => metadata.name)).toEqual([
            'bank',
            'carte',
            'code',
            'driver',
            'fidelity',
            'identity',
            'insurance',
            'login',
            'note',
        ]);
    });

    it('detects a credit card from its field types', () => {
        const item = getItem<'creditCard'>('carte');
        expect(item.type).toEqual('creditCard');
        expect(item.content.number).toEqual('42424242424242424242');
        expect(item.content.expirationDate).toEqual('042027');
        expect(item.content.verificationNumber).toEqual('424');
        expect(item.content.cardholderName).toEqual('Toto');
        expect(item.content.pin).toEqual('4242');
        expect(item.extraFields).toEqual([]);
    });

    it('detects a login without relying on the template name', () => {
        const item = getItem<'login'>('fidelity');
        expect(item.type).toEqual('login');
        expect(item.content.itemUsername).toEqual('sdaasdas');
        expect(item.content.password).toEqual('');
        expect(item.extraFields).toEqual([{ fieldName: 'Chiffre', type: 'text', data: { content: 'asdsadsad' } }]);
    });

    it('parses the English login template', () => {
        const item = getItem<'login'>('login');
        expect(item.type).toEqual('login');
        expect(item.metadata.note).toEqual('adsasdsa');
        expect(item.content.itemUsername).toEqual('toto');
        expect(item.content.password).toEqual('titi');
        expect(item.content.autofillUrls).toEqual([{ url: 'https://google.com/', mode: AutofillMode.Default }]);
    });

    it('imports other templates as notes with their fields', () => {
        const bank = getItem<'note'>('bank');
        expect(bank.type).toEqual('note');
        expect(bank.extraFields).toEqual([
            { fieldName: 'Numéro de compte', type: 'hidden', data: { content: '242441233412342314324' } },
            { fieldName: 'Code PIN', type: 'hidden', data: { content: '234234231423' } },
            { fieldName: 'Nom', type: 'text', data: { content: 'Toto' } },
        ]);

        const code = getItem<'note'>('code');
        expect(code.type).toEqual('note');
        expect(code.extraFields).toEqual([{ fieldName: 'Code', type: 'hidden', data: { content: 'asdsa' } }]);

        const driver = getItem<'note'>('driver');
        expect(driver.extraFields.map(({ fieldName }) => fieldName)).toEqual([
            'Nom complet',
            'Date de naissance',
            'Chiffre',
            'État',
            'Date de délivrance',
            "Date d'expiration",
        ]);

        const note = getItem<'note'>('note');
        expect(note.metadata.note).toEqual('note');
        expect(note.extraFields).toEqual([]);
    });
});

describe('Import mSecure csv (other app languages)', () => {
    beforeAll(() => {
        jest.mocked(epochUtils.getEpoch).mockImplementation(() => 1682585156);
    });

    const readCard = async (row: string) => {
        const payload = await readMSecureData(new File([row], 'msecure.csv'));
        return deobfuscateItem(payload.vaults[0].items[0]) as unknown as ItemImportIntent<'creditCard'>;
    };

    it('maps a card by field position when the labels are unknown', async () => {
        const item = await readCard(
            'Karte|1,Kreditkarte,,,Kartennummer|12|4242,Ablaufdatum|11|04/2027,Sicherheitscode|9|424,Name auf der Karte|0|Toto,PIN-Code|9|1234,Aussteller|0|Bank,\n'
        );
        expect(item.type).toEqual('creditCard');
        expect(item.content.number).toEqual('4242');
        expect(item.content.expirationDate).toEqual('042027');
        expect(item.content.verificationNumber).toEqual('424');
        expect(item.content.cardholderName).toEqual('Toto');
        expect(item.content.pin).toEqual('1234');
        expect(item.extraFields).toEqual([{ fieldName: 'Aussteller', type: 'text', data: { content: 'Bank' } }]);
    });

    it('keeps positions when optional card fields are empty', async () => {
        const item = await readCard(
            'Karte|1,Kreditkarte,,,Kartennummer|12|4242,Ablaufdatum|11|04/2027,Sicherheitscode|9|,Name auf der Karte|0|,PIN-Code|9|1234,\n'
        );
        expect(item.content.verificationNumber).toEqual('');
        expect(item.content.cardholderName).toEqual('');
        expect(item.content.pin).toEqual('1234');
    });

    it('does not swap fields on an older card layout with unknown labels', async () => {
        const item = await readCard(
            'Karte|1,Kreditkarte,,,Kartennummer|12|4242,Ablaufdatum|11|04/2027,Inhaber|9|Obi Wan,Sicherheitscode|9|444,\n'
        );
        expect(item.content.verificationNumber).toEqual('');
        expect(item.content.cardholderName).toEqual('');
        expect(item.extraFields).toEqual([
            { fieldName: 'Inhaber', type: 'hidden', data: { content: 'Obi Wan' } },
            { fieldName: 'Sicherheitscode', type: 'hidden', data: { content: '444' } },
        ]);
    });
});
