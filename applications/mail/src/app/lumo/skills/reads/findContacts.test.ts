import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { buildContactEmail } from '@proton/testing/builders/contactEmail';

import type { MailToolDeps } from '../../toolModule';
import { createFindContactsHandler, findContactsDefinition, matchContacts } from './findContacts';

const ada = buildContactEmail({
    ID: 'CONTACT_EMAIL_1',
    ContactID: 'CONTACT_1',
    Name: 'Ada Lovelace',
    Email: 'ada@example.com',
});
const rene = buildContactEmail({
    ID: 'CONTACT_EMAIL_2',
    ContactID: 'CONTACT_2',
    Name: 'René Descartes',
    Email: 'rene@cogito.fr',
});
const unnamed = buildContactEmail({ ID: 'CONTACT_EMAIL_3', ContactID: 'CONTACT_3', Name: '', Email: 'ops@acme.io' });
const namedByAddress = buildContactEmail({
    ID: 'CONTACT_EMAIL_4',
    ContactID: 'CONTACT_4',
    Name: 'billing@acme.io',
    Email: 'billing@acme.io',
});

const CONTACT_EMAILS = [ada, rene, unnamed, namedByAddress];

/** The serializer never resolves a reference, so an empty registry is enough. */
const emptyReferences = createReferenceRegistry();

const run = (query: string | null, contactEmails = CONTACT_EMAILS) => {
    const references = createReferenceRegistry();
    const handler = createFindContactsHandler({ getContactEmails: () => contactEmails } as MailToolDeps);
    return handler({ query }, { references } as any).then((result) => ({ result, references }));
};

const serialize = (query: string | null, contactEmails = CONTACT_EMAILS) =>
    run(query, contactEmails).then(({ result, references }) =>
        findContactsDefinition.serializeForLumo(result, references)
    );

describe('matchContacts', () => {
    it('matches part of a name, case-insensitively', () => {
        expect(matchContacts(CONTACT_EMAILS, 'lovel')).toEqual([ada]);
        expect(matchContacts(CONTACT_EMAILS, 'ADA LOVELACE')).toEqual([ada]);
    });

    it('matches part of an email address, case-insensitively', () => {
        expect(matchContacts(CONTACT_EMAILS, 'COGITO.FR')).toEqual([rene]);
        expect(matchContacts(CONTACT_EMAILS, 'ops@')).toEqual([unnamed]);
    });

    it('matches every contact sharing a domain', () => {
        expect(matchContacts(CONTACT_EMAILS, 'acme.io')).toEqual([unnamed, namedByAddress]);
    });

    it('folds diacritics on both sides, so the query and the saved name need not agree', () => {
        expect(matchContacts(CONTACT_EMAILS, 'rene descartes')).toEqual([rene]);
        expect(matchContacts(CONTACT_EMAILS, 'René')).toEqual([rene]);
    });

    it('returns nothing for a query no contact carries', () => {
        expect(matchContacts(CONTACT_EMAILS, 'babbage')).toEqual([]);
    });

    // The model has no other way to enumerate the address book; blocking this drove it to probe with a
    // single letter, which reads as a complete list while quietly dropping everyone without that letter.
    it.each([null, '', '   '])('lists the whole address book for %p, which is not a query', (query) => {
        expect(matchContacts(CONTACT_EMAILS, query)).toEqual(CONTACT_EMAILS);
    });

    it('returns nothing when the address book is empty', () => {
        expect(matchContacts([], 'ada')).toEqual([]);
    });
});

describe('find_contacts', () => {
    it('mints a reference per matched address and records the name for later cards', async () => {
        const { result, references } = await run('example.com');

        expect(result.matches).toHaveLength(1);
        expect(references.idFor(result.matches[0].reference)).toBe('CONTACT_EMAIL_1');
        expect(references.labelFor(result.matches[0].reference)).toEqual({
            title: 'Ada Lovelace',
            subtitle: 'ada@example.com',
        });
    });

    it('projects the name and address, and never the raw id', async () => {
        const serialized = await serialize('ada');

        expect(serialized).toContain('"Ada Lovelace" | ada@example.com');
        expect(serialized).not.toContain('CONTACT_EMAIL_1');
        expect(serialized).not.toContain('CONTACT_1');
    });

    it('projects the address alone when the saved name adds nothing to it', async () => {
        const { result } = await run('acme.io');
        const serialized = findContactsDefinition.serializeForLumo(result, emptyReferences);

        expect(serialized).toContain(`${result.matches[0].reference} | ops@acme.io`);
        expect(serialized).toContain(`${result.matches[1].reference} | billing@acme.io`);
        expect(serialized).not.toContain('""');
        expect(serialized).not.toContain('"billing@acme.io"');
    });

    it('names the count on its chip, and says plainly when nothing matched', async () => {
        const { result: found } = await run('ada');
        const { result: missed } = await run('babbage');

        expect(findContactsDefinition.summarizeChip({ query: 'ada' }, found).label).toBe('Found 1 contact');
        expect(findContactsDefinition.summarizeChip({ query: 'babbage' }, missed).label).toBe('No contacts found');
    });

    it('distinguishes a query that matched nothing from an empty address book', async () => {
        await expect(serialize('babbage')).resolves.toBe('No contacts match "babbage".');
        await expect(serialize('ada', [])).resolves.toBe('The user has no saved contacts.');
        await expect(serialize(null, [])).resolves.toBe('The user has no saved contacts.');
    });

    it('heads a full listing with the count and no query', async () => {
        const serialized = await serialize(null);

        expect(serialized).toContain(`${CONTACT_EMAILS.length} contacts:`);
        expect(serialized).not.toContain('matching');
    });

    // Reporting 50 of 60 as the whole address book is the failure this guards: the count must reach the
    // model even when the rows do not.
    it('caps a large listing and says how many it did not return', async () => {
        const many = Array.from({ length: 60 }, (_unused, index) =>
            buildContactEmail({ ID: `CONTACT_EMAIL_${index}`, Name: `Person ${index}`, Email: `p${index}@acme.io` })
        );

        const { result } = await run(null, many);

        expect(result.total).toBe(60);
        expect(result.matches).toHaveLength(50);
        expect(findContactsDefinition.serializeForLumo(result, emptyReferences)).toContain(
            '60 contacts, showing the first 50:'
        );
    });

    // `query` carries the user's words, and the engine's guard rejects any unissued value shaped like a
    // reference — so a surname like "e-ticket" would never reach the handler.
    it('exempts its query from the reference guard, leaving nothing guarded', () => {
        const guarded = Object.keys(findContactsDefinition.paramsSchema.properties).filter(
            (param) => !findContactsDefinition.freeTextParams?.includes(param)
        );

        expect(guarded).toEqual([]);
    });
});
