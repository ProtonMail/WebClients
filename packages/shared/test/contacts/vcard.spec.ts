import { createContactPropertyUid } from '@proton/shared/lib/contacts/properties';
import { parseToVCard, serialize } from '@proton/shared/lib/contacts/vcard';
import { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

describe('serialize', () => {
    describe('produces the expected vcf', () => {
        it('when there are all supported standard properties', () => {
            const contact: VCardContact = {
                version: { field: 'version', value: '4.0', uid: createContactPropertyUid() },
                n: {
                    field: 'n',
                    value: {
                        familyNames: ['Messi'],
                        givenNames: ['Lionel'],
                        additionalNames: ['Andrés'],
                        honorificPrefixes: [''],
                        honorificSuffixes: [''],
                    },
                    uid: createContactPropertyUid(),
                },
                fn: [{ field: 'fn', value: 'Leo Messi', uid: createContactPropertyUid() }],
                title: [{ field: 'title', value: 'Football ambassador', uid: createContactPropertyUid() }],
                nickname: [
                    { field: 'nickname', value: 'La Pulga', uid: createContactPropertyUid() },
                    { field: 'nickname', value: 'The Messiah', uid: createContactPropertyUid() },
                ],
                email: [
                    {
                        field: 'email',
                        value: 'leo@barca.cat',
                        params: { type: 'WORK', pref: '1' },
                        group: 'item1',
                        uid: createContactPropertyUid(),
                    },
                ],
                adr: [
                    {
                        field: 'adr',
                        value: {
                            postOfficeBox: '',
                            extendedAddress: '',
                            streetAddress: "Carrer d'Elisabeth Eidenbenz",
                            locality: 'Barcelona',
                            region: 'Catalunya',
                            postalCode: '08028',
                            country: 'Catalonia',
                        },
                        uid: createContactPropertyUid(),
                    },
                ],
                tel: [
                    {
                        field: 'tel',
                        value: 'tel:+1-555-555-5555;ext=5555',
                        params: {
                            value: 'uri',
                            type: 'voice',
                        },
                        uid: createContactPropertyUid(),
                    },
                ],
                bday: {
                    field: 'bday',
                    value: {
                        date: new Date(Date.UTC(1999, 5, 9)),
                    },
                    uid: createContactPropertyUid(),
                },
                anniversary: {
                    field: 'anniversary',
                    value: {
                        text: 'ferragosto',
                    },
                    uid: createContactPropertyUid(),
                },
                impp: [
                    {
                        field: 'impp',
                        value: 'xmpp:leo@barca.cat',
                        params: { pref: '1' },
                        uid: createContactPropertyUid(),
                    },
                ],
                photo: [{ field: 'photo', value: 'bcspevahwseowngfs23dkl1lsxslfj', uid: createContactPropertyUid() }],
                lang: [
                    {
                        field: 'lang',
                        params: { type: 'home', pref: '1' },
                        value: 'es',
                        uid: createContactPropertyUid(),
                    },
                    {
                        field: 'lang',
                        params: { type: 'work', pref: '1' },
                        value: 'es',
                        uid: createContactPropertyUid(),
                    },
                    {
                        field: 'lang',
                        params: { type: 'work', pref: '2' },
                        value: 'en',
                        uid: createContactPropertyUid(),
                    },
                ],
                geo: [{ field: 'geo', value: 'geo:37.386013,-122.082932', uid: createContactPropertyUid() }],
                role: [{ field: 'role', value: 'Fake 9', uid: createContactPropertyUid() }],
                logo: [
                    {
                        field: 'logo',
                        value: 'https://static.messi.com/wp-content/uploads/2019/10/messi-logo-01.png',
                        uid: createContactPropertyUid(),
                    },
                ],
                org: [
                    {
                        field: 'org',
                        value: { organizationalName: 'Barcelona FC', organizationalUnitNames: ['Training-center'] },
                        uid: createContactPropertyUid(),
                    },
                    {
                        field: 'org',
                        value: { organizationalName: 'Leo Messi Foundation' },
                        uid: createContactPropertyUid(),
                    },
                ],
                member: [{ field: 'member', value: 'tel:+1-418-555-5555', uid: createContactPropertyUid() }],
                related: [
                    {
                        field: 'related',
                        params: { type: 'spouse' },
                        value: 'Antonela Roccuzzo',
                        uid: createContactPropertyUid(),
                    },
                    {
                        field: 'related',
                        params: { type: 'child' },
                        value: 'Matteo Messi Roccuzzo',
                        uid: createContactPropertyUid(),
                    },
                    {
                        field: 'related',
                        params: { type: 'child' },
                        value: 'Thiago Messi Roccuzzo',
                        uid: createContactPropertyUid(),
                    },
                    {
                        field: 'related',
                        params: { type: 'child' },
                        value: 'Ciro Messi Roccuzzo',
                        uid: createContactPropertyUid(),
                    },
                ],
                note: [{ field: 'note', value: 'Way better than Cristiano Ronaldo!', uid: createContactPropertyUid() }],
                url: [{ field: 'url', value: 'https://messi.com/', uid: createContactPropertyUid() }],
                categories: [
                    {
                        field: 'categories',
                        value: 'Tax-evading players',
                        uid: createContactPropertyUid(),
                    },
                    {
                        field: 'categories',
                        value: 'Best players of all time',
                        uid: createContactPropertyUid(),
                    },
                ],
            };
            const vcf = [
                `BEGIN:VCARD`,
                `VERSION:4.0`,
                `FN:Leo Messi`,
                `N:Messi;Lionel;Andrés;;`,
                `TITLE:Football ambassador`,
                `NICKNAME:La Pulga`,
                `NICKNAME:The Messiah`,
                `ITEM1.EMAIL;TYPE=WORK;PREF=1:leo@barca.cat`,
                `ADR:;;Carrer d'Elisabeth Eidenbenz;Barcelona;Catalunya;08028;Catalonia`,
                `TEL;VALUE=uri;TYPE=voice:tel:+1-555-555-5555;ext=5555`,
                `BDAY:19990609`,
                `ANNIVERSARY;VALUE=TEXT:ferragosto`,
                `IMPP;PREF=1:xmpp:leo@barca.cat`,
                `PHOTO:bcspevahwseowngfs23dkl1lsxslfj`,
                `LANG;TYPE=home;PREF=1:es`,
                `LANG;TYPE=work;PREF=1:es`,
                `LANG;TYPE=work;PREF=2:en`,
                `GEO;VALUE=FLOAT:geo:37.386013,-122.082932`,
                `ROLE:Fake 9`,
                `LOGO:https://static.messi.com/wp-content/uploads/2019/10/messi-logo-01.png`,
                `ORG:Barcelona FC;Training-center`,
                `ORG:Leo Messi Foundation`,
                `MEMBER:tel:+1-418-555-5555`,
                `RELATED;TYPE=spouse:Antonela Roccuzzo`,
                `RELATED;TYPE=child:Matteo Messi Roccuzzo`,
                `RELATED;TYPE=child:Thiago Messi Roccuzzo`,
                `RELATED;TYPE=child:Ciro Messi Roccuzzo`,
                `NOTE:Way better than Cristiano Ronaldo!`,
                `URL:https://messi.com/`,
                `CATEGORIES:Tax-evading players`,
                `CATEGORIES:Best players of all time`,
                `END:VCARD`,
            ].join('\r\n');

            expect(serialize(contact)).toEqual(vcf);
        });

        it('when there are both categories with vcard group and without', () => {
            const contact: VCardContact = {
                version: { field: 'version', value: '4.0', uid: createContactPropertyUid() },
                fn: [{ field: 'fn', value: 'dummy', uid: createContactPropertyUid() }],
                categories: [
                    { field: 'categories', value: 'first', uid: createContactPropertyUid() },
                    {
                        field: 'categories',
                        group: 'item1',
                        value: 'second',
                        uid: createContactPropertyUid(),
                    },
                    {
                        field: 'categories',
                        group: 'item1',
                        value: 'third',
                        uid: createContactPropertyUid(),
                    },
                ],
            };
            const vcf = [
                `BEGIN:VCARD`,
                `VERSION:4.0`,
                `FN:dummy`,
                `CATEGORIES:first`,
                `ITEM1.CATEGORIES:second`,
                `ITEM1.CATEGORIES:third`,
                `END:VCARD`,
            ].join('\r\n');

            expect(serialize(contact)).toEqual(vcf);
        });

        it('unexpectedly prints FLOAT for the GEO property', () => {
            const contact: VCardContact = {
                version: { field: 'version', value: '4.0', uid: createContactPropertyUid() },
                fn: [{ field: 'fn', value: 'dummy', uid: createContactPropertyUid() }],
                geo: [{ field: 'geo', value: 'geo:41,34', uid: createContactPropertyUid() }],
            };
            const vcf = [`BEGIN:VCARD`, `VERSION:4.0`, `FN:dummy`, `GEO;VALUE=FLOAT:geo:41,34`, `END:VCARD`].join(
                '\r\n'
            );

            expect(serialize(contact)).toEqual(vcf);
        });

        it('no value is passed to FN field', () => {
            const contact = {
                version: { field: 'version', value: '4.0', uid: createContactPropertyUid() },
                fn: [{ field: 'fn', value: '', uid: createContactPropertyUid(), params: { pref: '1' } }],
            };

            expect(serialize(contact)).toEqual([`BEGIN:VCARD`, `VERSION:4.0`, `END:VCARD`].join('\r\n'));
        });
    });

    describe('round trips with parse', () => {
        it('for a simple vcard', () => {
            const vcf = [
                `BEGIN:VCARD`,
                `VERSION:4.0`,
                // `FN;PID=1.1:J. Doe`,
                // `UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1`,
                `N:Doe;J.;;;`,
                // `EMAIL;PID=1.1:jdoe@example.com`,
                // `EMAIL:jdoeeeee@example.com`,
                // `CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556`,
                // `CATEGORIES:TRAVEL AGENT`,
                // `CATEGORIES:INTERNET,IETF,INDUSTRY,INFORMATION TECHNOLOGY`,
                `END:VCARD`,
            ].join('\r\n');

            expect(serialize(parseToVCard(vcf))).toEqual(vcf);
        });

        it('always puts FN after version', () => {
            const vcf = [
                `BEGIN:VCARD`,
                `VERSION:4.0`,
                `UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1`,
                `N:Doe;J.;;;`,
                `EMAIL;PID=1.1:jdoe@example.com`,
                `EMAIL:jdoeeeee@example.com`,
                `CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556`,
                `FN;PID=1.1:J. Doe`,
                `CATEGORIES:TRAVEL AGENT`,
                `CATEGORIES:INTERNET,IETF,INDUSTRY,INFORMATION TECHNOLOGY`,
                `END:VCARD`,
            ].join('\r\n');
            const expected = [
                `BEGIN:VCARD`,
                `VERSION:4.0`,
                `FN;PID=1.1:J. Doe`,
                `UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1`,
                `N:Doe;J.;;;`,
                `EMAIL;PID=1.1:jdoe@example.com`,
                `EMAIL:jdoeeeee@example.com`,
                `CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556`,
                `CATEGORIES:TRAVEL AGENT`,
                `CATEGORIES:INTERNET,IETF,INDUSTRY,INFORMATION TECHNOLOGY`,
                `END:VCARD`,
            ].join('\r\n');

            expect(serialize(parseToVCard(vcf))).toEqual(expected);
        });
    });
});

describe('parseToVcard', () => {
    describe('parses correctly the N property', () => {
        it('when it contains all components and single values', () => {
            const vcf = [`BEGIN:VCARD`, `VERSION:4.0`, `N:Public;John;Quinlan;Mr.;Esq.`, `END:VCARD`].join('\r\n');

            const result = parseToVCard(vcf);
            expect(result.n?.value).toEqual({
                familyNames: ['Public'],
                givenNames: ['John'],
                additionalNames: ['Quinlan'],
                honorificPrefixes: ['Mr.'],
                honorificSuffixes: ['Esq.'],
            });
        });

        it('when it contains all components and multiple values', () => {
            const vcf = [
                `BEGIN:VCARD`,
                `VERSION:4.0`,
                `N:Stevenson;John;Philip,Paul;Dr.;Jr.,M.D.,A.C.P.`,
                `END:VCARD`,
            ].join('\r\n');

            const result = parseToVCard(vcf);
            expect(result.n?.value).toEqual({
                familyNames: ['Stevenson'],
                givenNames: ['John'],
                additionalNames: ['Philip', 'Paul'],
                honorificPrefixes: ['Dr.'],
                honorificSuffixes: ['Jr.', 'M.D.', 'A.C.P.'],
            });
        });

        it('when it contains all components and some are empty', () => {
            const vcf = [`BEGIN:VCARD`, `VERSION:4.0`, `N:Yamada;Taro;;;`, `END:VCARD`].join('\r\n');

            const result = parseToVCard(vcf);
            expect(result.n?.value).toEqual({
                familyNames: ['Yamada'],
                givenNames: ['Taro'],
                additionalNames: [''],
                honorificPrefixes: [''],
                honorificSuffixes: [''],
            });
        });
    });

    describe('can parse a vcard with an invalid N property', () => {
        it('if the N property has no semicolon at all', () => {
            const vcf = [`BEGIN:VCARD`, `VERSION:4.0`, `FN:Santa Claus`, `N:Santa Claus`, `END:VCARD`].join('\r\n');

            const result = parseToVCard(vcf);
            expect(result.fn[0].value).toBe('Santa Claus');
            expect(result.n?.value).toEqual({
                familyNames: ['Santa Claus'],
                givenNames: [''],
                additionalNames: [''],
                honorificPrefixes: [''],
                honorificSuffixes: [''],
            });
        });

        it('if the N property has an incorrect number of semicolons', () => {
            const vcf = [`BEGIN:VCARD`, `VERSION:4.0`, `FN:Santa Claus`, `N:Claus;Santa`, `END:VCARD`].join('\r\n');

            const result = parseToVCard(vcf);
            expect(result.fn[0].value).toBe('Santa Claus');
            expect(result.n?.value).toEqual({
                familyNames: ['Claus'],
                givenNames: ['Santa'],
                additionalNames: [''],
                honorificPrefixes: [''],
                honorificSuffixes: [''],
            });
        });
    });
});
