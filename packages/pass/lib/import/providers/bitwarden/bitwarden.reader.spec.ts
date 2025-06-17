import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemType } from '@proton/pass/types';

import { readBitwardenData } from './bitwarden.reader';

const sourceFiles = {
    'bitwarden.json': `${__dirname}/mocks/bitwarden.json`,
    'bitwarden-b2b.json': `${__dirname}/mocks/bitwarden-b2b.json`,
    'bitwarden-empty.json': `${__dirname}/mocks/bitwarden-empty.json`,
};

const data: Record<string, ImportPayload> = {};

const getBitwardenData = (sourceKey: string) => data[sourceKey];
const getBitwardenItem = <T extends ItemType>(sourceKey: string, vaultIndex: number = 0, itemIndex: number = 0) =>
    deobfuscateItem<T>(data[sourceKey].vaults[vaultIndex].items[itemIndex]);

describe('Import bitwarden json', () => {
    beforeAll(async () => {
        for (const [key, sourceFile] of Object.entries(sourceFiles)) {
            const sourceData = fs.readFileSync(sourceFile);
            const file = new File([sourceData], sourceFile);
            data[key] = await readBitwardenData(file);
        }
    });

    describe('JSON reader', () => {
        test.each([
            new File([JSON.stringify({ encrypted: true, items: [] })], 'encrypted'),
            new File(['not-a-json-body'], 'corrupted'),
            new File([JSON.stringify({ encrypted: false })], 'corrupted'),
            new File([JSON.stringify({ encrypted: false, items: '[]' })], 'corrupted'),
        ])('should throw on invalid payloads', async (file) => {
            await expect(() => readBitwardenData(file)).rejects.toThrow();
        });
    });

    describe('Bitwarden import', () => {
        test('should correctly parse vaults', () => {
            const { vaults } = getBitwardenData('bitwarden.json');
            const [primary, secondary] = vaults;

            expect(vaults.length).toEqual(2);
            expect(primary.items.length).toEqual(7);
            expect(primary.name).not.toBeUndefined();
            expect(secondary.items.length).toEqual(3);
            expect(secondary.name).toEqual('custom folder');
        });

        test('should support login items', () => {
            const item = getBitwardenItem<'login'>('bitwarden.json', 0, 0);
            expect(item.type).toBe('login');
            expect(item.metadata.name).toBe('LoginItemMultipleWebsites');
            expect(item.metadata.note).toBe('login note');
            expect(item.content.itemEmail).toBe('');
            expect(item.content.itemUsername).toBe('username');
            expect(item.content.password).toBe('password');
            expect(item.content.urls[0]).toBe('https://test.url1/');
            expect(item.content.urls[1]).toBe('https://test.url2/');

            const totp = 'otpauth://totp/test?issuer=proton&secret=PROTON333&algorithm=SHA1&digits=6&period=30';
            expect(item.content.totpUri).toBe(totp);

            expect(item.extraFields).toEqual([
                { fieldName: 'Text 1', type: 'text', data: { content: 'Text 1 content' } },
                { fieldName: 'Hidden 1', type: 'hidden', data: { content: 'Hidden 1 content' } },
            ]);

            const allowedApp = item.platformSpecific?.android?.allowedApps[0];
            expect(allowedApp?.packageName).toEqual('ch.protonmail.android');
            expect(allowedApp?.hashes).toContain('ch.protonmail.android');
        });

        test('should support identity items', () => {
            const item = getBitwardenItem<'identity'>('bitwarden.json', 0, 1);
            expect(item.type).toBe('identity');
            expect(item.metadata.name).toBe('IdentityItem');
            expect(item.content.fullName).toStrictEqual('');
            expect(item.content.firstName).toStrictEqual('John');
            expect(item.content.middleName).toStrictEqual('F');
            expect(item.content.lastName).toStrictEqual('Kennedy');
            expect(item.content.fullName).toStrictEqual('');
            expect(item.content.email).toStrictEqual('');
            expect(item.content.phoneNumber).toStrictEqual('');
            expect(item.content.birthdate).toStrictEqual('');
            expect(item.content.gender).toStrictEqual('');
            expect(item.content.organization).toStrictEqual('');
            expect(item.content.streetAddress).toStrictEqual('');
            expect(item.content.zipOrPostalCode).toStrictEqual('');
            expect(item.content.city).toStrictEqual('');
            expect(item.content.stateOrProvince).toStrictEqual('');
            expect(item.content.countryOrRegion).toStrictEqual('');
            expect(item.content.floor).toStrictEqual('');
            expect(item.content.county).toStrictEqual('');
            expect(item.content.socialSecurityNumber).toStrictEqual('');
            expect(item.content.passportNumber).toStrictEqual('');
            expect(item.content.licenseNumber).toStrictEqual('');
            expect(item.content.website).toStrictEqual('');
            expect(item.content.xHandle).toStrictEqual('');
            expect(item.content.secondPhoneNumber).toStrictEqual('');
            expect(item.content.linkedin).toStrictEqual('');
            expect(item.content.reddit).toStrictEqual('');
            expect(item.content.facebook).toStrictEqual('');
            expect(item.content.yahoo).toStrictEqual('');
            expect(item.content.instagram).toStrictEqual('');
            expect(item.content.company).toStrictEqual('');
            expect(item.content.jobTitle).toStrictEqual('');
            expect(item.content.personalWebsite).toStrictEqual('');
            expect(item.content.workPhoneNumber).toStrictEqual('');
            expect(item.content.workEmail).toStrictEqual('');
            expect(item.content.extraAddressDetails).toStrictEqual([]);
            expect(item.content.extraContactDetails).toStrictEqual([]);
            expect(item.content.extraPersonalDetails).toStrictEqual([]);
            expect(item.content.extraWorkDetails).toStrictEqual([]);
            expect(item.content.extraSections).toStrictEqual([]);
        });

        test('should support note items', () => {
            const item = getBitwardenItem<'note'>('bitwarden.json', 0, 2);
            expect(item.type).toBe('note');
            expect(item.metadata.name).toBe('NoteItem');
            expect(item.metadata.note).toBe('note content');
            expect(item.content).toStrictEqual({});
        });

        test('should support empty login items', () => {
            const item = getBitwardenItem<'login'>('bitwarden.json', 0, 3);
            expect(item.type).toBe('login');
            expect(item.metadata.name).toBe('LoginItemEmptyFields');
            expect(item.metadata.note).toBe('login note');
            expect(item.content.itemEmail).toStrictEqual('');
            expect(item.content.itemUsername).toStrictEqual('');
            expect(item.content.password).toStrictEqual('');
            expect(item.content.urls).toStrictEqual([]);
            expect(item.content.totpUri).toStrictEqual('');
        });

        test('should support login with malformed URLs', () => {
            const item = getBitwardenItem<'login'>('bitwarden.json', 0, 4);
            expect(item.type).toBe('login');
            expect(item.metadata.name).toBe('LoginItemBrokenUrl');
            expect(item.metadata.note).toBe('');
            expect(item.content.itemEmail).toStrictEqual('');
            expect(item.content.itemUsername).toStrictEqual('');
            expect(item.content.password).toStrictEqual('');
            expect(item.content.urls).toStrictEqual([]);
            expect(item.content.totpUri).toStrictEqual('');
        });

        test('should support credit card items', () => {
            const item = getBitwardenItem<'creditCard'>('bitwarden.json', 0, 5);
            expect(item.type).toBe('creditCard');
            expect(item.metadata.name).toBe('Credit Card Y');
            expect(item.metadata.note).toBe('Credit Card Y AMEX note');
            expect(item.content.cardholderName).toBe('A B');
            expect(item.content.number).toBe('374242424242424');
            expect(item.content.verificationNumber).toBe('123');
            expect(item.content.expirationDate).toBe('012025');
        });

        test('should support SSH key items', () => {
            const item = getBitwardenItem<'sshKey'>('bitwarden.json', 0, 6);
            expect(item.type).toBe('sshKey');
            expect(item.metadata.name).toBe('test ssh');
            expect(item.metadata.note).toBe('');
            expect(item.content.privateKey).toEqual('-----BEGIN TEST -----\n00000000000000\n-----END TEST-----\n');
            expect(item.content.publicKey).toEqual('ssh-ed25519 000000000');
            expect(item.content.sections).toEqual([
                {
                    sectionName: 'Extra fields',
                    sectionFields: [
                        {
                            data: { content: 'SHA256:000000000' },
                            fieldName: 'Key fingerprint',
                            type: 'hidden',
                        },
                    ],
                },
            ]);
        });

        test('should support all bitwarden extra fields', () => {
            const item = getBitwardenItem<'login'>('bitwarden.json', 1, 2);
            expect(item.extraFields).toEqual([
                { fieldName: '[TEXT]', type: 'text', data: { content: 'hello' } },
                { fieldName: '[HIDDEN]', type: 'hidden', data: { content: 'foobar' } },
                { fieldName: '[CHECKBOX]', type: 'text', data: { content: 'true' } },
            ]);
        });

        test('should not ignore any bitwarden items', () => {
            const { ignored } = getBitwardenData('bitwarden.json');
            expect(ignored).toEqual([]);
        });
    });

    describe('Bitwarden B2B import', () => {
        test('correctly parses b2b exports', () => {
            const { vaults } = getBitwardenData('bitwarden-b2b.json');
            const [primary, secondary] = vaults;

            expect(vaults.length).toBe(2);
            expect(primary.name).toBe('Collection 2');
            expect(secondary.name).toBe('collection 1');
        });
    });

    describe('Bitwarden empty import', () => {
        test('correctly parses b2b exports', () => {
            const { vaults } = getBitwardenData('bitwarden-empty.json');
            expect(vaults.length).toBe(0);
        });
    });
});
