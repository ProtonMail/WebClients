import { buildContactEmail } from '@proton/account/testing/buildContactEmail';
import { SaveVCardContactError } from '@proton/components/containers/contacts/hooks/useSaveVCardContact';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { createContactPropertyUid } from '@proton/shared/lib/contacts/properties';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { ContactMetadata } from '@proton/shared/lib/interfaces/contacts/Contact';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

import type { MailToolDeps } from '../../toolModule';
import { createUpdateContactHandler, updateContactCardRenderer, updateContactDefinition } from './updateContact';

const CONTACT_EMAIL_ID = 'CE_123';
const CONTACT_ID = 'C_456';

const ADA_CE = buildContactEmail({
    ID: CONTACT_EMAIL_ID,
    ContactID: CONTACT_ID,
    Name: 'Ada Lovelace',
    Email: 'ada@example.com',
});

const buildExistingVCard = (overrides: Partial<VCardContact> = {}): VCardContact => ({
    fn: [{ field: 'fn', value: 'Ada Lovelace', uid: createContactPropertyUid() }],
    n: {
        field: 'n',
        value: {
            familyNames: ['Lovelace'],
            givenNames: ['Ada'],
            additionalNames: [''],
            honorificPrefixes: [''],
            honorificSuffixes: [''],
        },
        uid: createContactPropertyUid(),
    },
    email: [{ field: 'email', value: 'ada@example.com', uid: createContactPropertyUid() }],
    ...overrides,
});

const buildSavedContact = (overrides: Partial<ContactMetadata> = {}): ContactMetadata => ({
    ID: CONTACT_ID,
    Name: 'Ada Lovelace',
    UID: 'contact-uid',
    Size: 0,
    CreateTime: 0,
    ModifyTime: 0,
    ContactEmails: [ADA_CE],
    LabelIDs: [],
    ...overrides,
});

const setUp = (existingVCard = buildExistingVCard(), saved: ContactMetadata | undefined = buildSavedContact()) => {
    const references = createReferenceRegistry();
    const ref = references.referenceFor('contact', CONTACT_EMAIL_ID, {
        title: 'Ada Lovelace',
        subtitle: 'ada@example.com',
    });

    const saveVCardContact = jest.fn().mockResolvedValue(saved);
    const getFullContact = jest.fn().mockResolvedValue(existingVCard);
    const getContactEmails = jest.fn().mockReturnValue([ADA_CE]);

    const deps = { saveVCardContact, getFullContact, getContactEmails } as unknown as MailToolDeps;

    return { references, ref, saveVCardContact, getFullContact, getContactEmails, deps };
};

describe('createUpdateContactHandler', () => {
    it('rejects all-null fields', async () => {
        const { references, ref, deps } = setUp();

        await expect(
            createUpdateContactHandler(deps)(
                { contact: ref, name: null, first_name: null, last_name: null, email: null },
                { references }
            )
        ).rejects.toThrow(ToolInputError);
    });

    it('rejects an invalid email', async () => {
        const { references, ref, deps } = setUp();

        await expect(
            createUpdateContactHandler(deps)(
                { contact: ref, name: null, first_name: null, last_name: null, email: 'not-an-email' },
                { references }
            )
        ).rejects.toThrow(/"not-an-email" is not a valid email/);
    });

    it('accepts a valid partial update (email only)', async () => {
        const { references, ref, deps, saveVCardContact } = setUp();

        await createUpdateContactHandler(deps)(
            { contact: ref, name: null, first_name: null, last_name: null, email: 'ada@newdomain.com' },
            { references }
        );

        expect(saveVCardContact).toHaveBeenCalled();
    });

    it('does not save when nothing changed', async () => {
        const { references, ref, deps, saveVCardContact } = setUp();

        await expect(
            createUpdateContactHandler(deps)(
                { contact: ref, name: 'Ada Lovelace', first_name: null, last_name: null, email: null },
                { references }
            )
        ).rejects.toThrow(/Nothing was changed/);

        expect(saveVCardContact).not.toHaveBeenCalled();
    });

    it('saves a merged vCard with the name changed, using ContactID not ContactEmail.ID', async () => {
        const { references, ref, deps, saveVCardContact } = setUp();

        await createUpdateContactHandler(deps)(
            { contact: ref, name: 'Augusta Ada King', first_name: 'Augusta Ada', last_name: 'King', email: null },
            { references }
        );

        expect(saveVCardContact).toHaveBeenCalledWith(
            CONTACT_ID,
            expect.objectContaining({
                fn: [expect.objectContaining({ value: 'Augusta Ada King' })],
                n: expect.objectContaining({
                    value: expect.objectContaining({
                        givenNames: ['Augusta Ada'],
                        familyNames: ['King'],
                    }),
                }),
            })
        );

        expect(saveVCardContact.mock.calls[0][0]).toBe(CONTACT_ID);
    });

    it('saves a merged vCard with the email changed', async () => {
        const { references, ref, deps, saveVCardContact } = setUp();

        await createUpdateContactHandler(deps)(
            { contact: ref, name: null, first_name: null, last_name: null, email: 'ada@newdomain.com' },
            { references }
        );

        expect(saveVCardContact).toHaveBeenCalledWith(
            CONTACT_ID,
            expect.objectContaining({
                email: [expect.objectContaining({ value: 'ada@newdomain.com' })],
            })
        );
    });

    it('throws ToolInputError when the contact is not in getContactEmails()', async () => {
        const { references, ref, deps, getContactEmails } = setUp();
        getContactEmails.mockReturnValue([]);

        await expect(
            createUpdateContactHandler(deps)(
                { contact: ref, name: 'New Name', first_name: null, last_name: null, email: null },
                { references }
            )
        ).rejects.toThrow(ToolInputError);
    });

    it('throws ToolInputError on duplicate email (ALREADY_EXISTS)', async () => {
        const { references, ref, deps, saveVCardContact } = setUp();
        saveVCardContact.mockRejectedValue(new SaveVCardContactError(API_CUSTOM_ERROR_CODES.ALREADY_EXISTS));

        await expect(
            createUpdateContactHandler(deps)(
                { contact: ref, name: null, first_name: null, last_name: null, email: 'taken@example.com' },
                { references }
            )
        ).rejects.toThrow(/already saved on another contact/);
    });

    it('leaves non-SaveVCardContactError failures untouched', async () => {
        const { references, ref, deps, saveVCardContact } = setUp();
        const failure = new SaveVCardContactError(null);
        saveVCardContact.mockRejectedValue(failure);

        await expect(
            createUpdateContactHandler(deps)(
                { contact: ref, name: null, first_name: null, last_name: null, email: 'new@example.com' },
                { references }
            )
        ).rejects.toBe(failure);
    });

    it('preserves extra emails when updating the primary one', async () => {
        const secondEmail = { field: 'email' as const, value: 'ada.work@example.com', uid: createContactPropertyUid() };
        const vCardWithTwoEmails = buildExistingVCard({
            email: [{ field: 'email', value: 'ada@example.com', uid: createContactPropertyUid() }, secondEmail],
        });
        const { references, ref, deps, saveVCardContact } = setUp(vCardWithTwoEmails);

        await createUpdateContactHandler(deps)(
            { contact: ref, name: null, first_name: null, last_name: null, email: 'ada@newdomain.com' },
            { references }
        );

        const savedVCard = saveVCardContact.mock.calls[0][1];
        expect(savedVCard.email).toHaveLength(2);
        const savedValues = savedVCard.email.map((e: { value: string }) => e.value).sort();
        expect(savedValues).toEqual(['ada.work@example.com', 'ada@newdomain.com']);
    });

    it('updates the secondary email when the reference points to it', async () => {
        const SECONDARY_CE_ID = 'CE_WORK';
        const secondaryCE = buildContactEmail({
            ID: SECONDARY_CE_ID,
            ContactID: CONTACT_ID,
            Name: 'Ada Lovelace',
            Email: 'ada.work@example.com',
        });

        const vCard = buildExistingVCard({
            email: [
                { field: 'email', value: 'ada@example.com', uid: createContactPropertyUid() },
                { field: 'email', value: 'ada.work@example.com', uid: createContactPropertyUid() },
            ],
        });

        const references = createReferenceRegistry();
        const ref = references.referenceFor('contact', SECONDARY_CE_ID, {
            title: 'Ada Lovelace',
            subtitle: 'ada.work@example.com',
        });

        const saveVCardContact = jest
            .fn()
            .mockResolvedValue(buildSavedContact({ ContactEmails: [ADA_CE, secondaryCE] }));
        const getFullContact = jest.fn().mockResolvedValue(vCard);
        const getContactEmails = jest.fn().mockReturnValue([ADA_CE, secondaryCE]);
        const deps = { saveVCardContact, getFullContact, getContactEmails } as unknown as MailToolDeps;

        await createUpdateContactHandler(deps)(
            { contact: ref, name: null, first_name: null, last_name: null, email: 'ada.new@example.com' },
            { references }
        );

        const savedVCard = saveVCardContact.mock.calls[0][1];
        expect(savedVCard.email).toHaveLength(2);
        expect(savedVCard.email[0].value).toBe('ada@example.com');
        expect(savedVCard.email[1].value).toBe('ada.new@example.com');
    });

    it('treats blank-but-non-null fields as null (no-op)', async () => {
        const { references, ref, deps, saveVCardContact } = setUp();

        await expect(
            createUpdateContactHandler(deps)(
                { contact: ref, name: '   ', first_name: null, last_name: null, email: null },
                { references }
            )
        ).rejects.toThrow(ToolInputError);

        expect(saveVCardContact).not.toHaveBeenCalled();
    });

    it('creates the n property when first/last are set on a contact without one', async () => {
        const vCardWithoutN = buildExistingVCard();
        delete vCardWithoutN.n;
        const { references, ref, deps, saveVCardContact } = setUp(vCardWithoutN);

        await createUpdateContactHandler(deps)(
            { contact: ref, name: null, first_name: 'Ada', last_name: 'Lovelace', email: null },
            { references }
        );

        expect(saveVCardContact).toHaveBeenCalledWith(
            CONTACT_ID,
            expect.objectContaining({
                n: expect.objectContaining({
                    value: expect.objectContaining({
                        givenNames: ['Ada'],
                        familyNames: ['Lovelace'],
                    }),
                }),
            })
        );
    });
});

describe('updateContactCardRenderer', () => {
    it('disables Confirm when no field is non-null', () => {
        expect(
            updateContactCardRenderer.canApply?.({
                contact: 'contact-abc',
                name: null,
                first_name: null,
                last_name: null,
                email: null,
            })
        ).toBe(false);
    });

    it('enables Confirm when at least one field is non-null', () => {
        expect(updateContactCardRenderer.canApply?.({ contact: 'contact-abc', name: 'New', email: null })).toBe(true);
    });

    it('disables Confirm on invalid email', () => {
        expect(updateContactCardRenderer.canApply?.({ contact: 'contact-abc', name: null, email: 'bad@' })).toBe(false);
    });
});

describe('serializeForLumo', () => {
    const anyReferences = {} as any;

    it('carries the reference and identity', () => {
        expect(
            updateContactDefinition.serializeForLumo(
                { reference: 'contact-x7b2q1', name: 'Ada Lovelace', email: 'ada@newdomain.com' },
                anyReferences
            )
        ).toBe('Updated contact contact-x7b2q1 | "Ada Lovelace" | ada@newdomain.com.');
    });

    it('omits email and reference when absent', () => {
        expect(updateContactDefinition.serializeForLumo({ name: 'Ada Lovelace' }, anyReferences)).toBe(
            'Updated contact "Ada Lovelace".'
        );
    });
});
