import { buildContactEmail } from '@proton/account/testing/buildContactEmail';
import { SaveVCardContactError } from '@proton/components/containers/contacts/hooks/useSaveVCardContact';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ReferenceRegistry } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { ContactMetadata } from '@proton/shared/lib/interfaces/contacts/Contact';

import type { MailToolDeps } from '../../toolModule';
import type { AddedContactResult } from './addContact';
import {
    addContactCardRenderer,
    addContactDefinition,
    createAddContactHandler,
    openContactEditor,
    resolveContactInput,
} from './addContact';

const ADA = buildContactEmail({ ID: 'CONTACT_EMAIL_ID', Name: 'Ada Lovelace', Email: 'ada@example.com' });

const buildSavedContact = (value?: Partial<ContactMetadata>): ContactMetadata => ({
    ID: 'CONTACT_ID',
    Name: 'Ada Lovelace',
    UID: 'contact-uid',
    Size: 0,
    CreateTime: 0,
    ModifyTime: 0,
    ContactEmails: [ADA],
    LabelIDs: [],
    ...value,
});

const setUp = (saved: ContactMetadata | undefined = buildSavedContact()) => {
    const references = createReferenceRegistry();
    const saveVCardContact = jest.fn().mockResolvedValue(saved);

    return { references, saveVCardContact, deps: { saveVCardContact } as unknown as MailToolDeps };
};

describe('resolveContactInput', () => {
    it('keeps every field it was given, trimmed', () => {
        expect(
            resolveContactInput({
                name: ' Ada Lovelace ',
                first_name: ' Ada ',
                last_name: ' Lovelace ',
                email: ' ada@example.com ',
            })
        ).toEqual({ name: 'Ada Lovelace', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' });
    });

    it('saves a name on its own, with nothing else to attach', () => {
        expect(resolveContactInput({ name: 'Ada Lovelace', first_name: null, last_name: null, email: null })).toEqual({
            name: 'Ada Lovelace',
        });
    });

    // The editor computes its display name the same way, and `encrypt` falls back to it on save.
    it('builds the display name from the split name when the model sent no whole one', () => {
        expect(resolveContactInput({ name: null, first_name: 'Ada', last_name: 'Lovelace', email: null })).toEqual({
            name: 'Ada Lovelace',
            firstName: 'Ada',
            lastName: 'Lovelace',
        });
    });

    // vCard requires `fn`, and a contact saved under its own address is displayed as the address alone.
    it('names an email-only contact after the address', () => {
        expect(
            resolveContactInput({ name: null, first_name: null, last_name: null, email: 'ada@example.com' })
        ).toEqual({ name: 'ada@example.com', email: 'ada@example.com' });
    });

    it('refuses a contact with no name and no address', () => {
        expect(() => resolveContactInput({ name: '  ', first_name: null, last_name: '  ', email: null })).toThrow(
            ToolInputError
        );
    });

    it('refuses an address the API would reject, naming it back to the model', () => {
        expect(() => resolveContactInput({ name: 'Ada', first_name: null, last_name: null, email: 'ada@' })).toThrow(
            /"ada@" is not a valid email/
        );
    });
});

describe('createAddContactHandler', () => {
    // `undefined` is the create path: `useSaveVCardContact` branches on the contact id, and a defined one
    // would overwrite an existing contact's cards instead.
    it('creates rather than updates, sending a grouped email property', async () => {
        const { references, saveVCardContact, deps } = setUp();

        await createAddContactHandler(deps)(
            { name: 'Ada Lovelace', first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' },
            { references }
        );

        expect(saveVCardContact).toHaveBeenCalledWith(undefined, {
            fn: [{ field: 'fn', value: 'Ada Lovelace', params: { pref: 1 }, uid: expect.any(String) }],
            n: {
                field: 'n',
                value: {
                    familyNames: ['Lovelace'],
                    givenNames: ['Ada'],
                    additionalNames: [''],
                    honorificPrefixes: [''],
                    honorificSuffixes: [''],
                },
                uid: expect.any(String),
            },
            email: [
                {
                    field: 'email',
                    value: 'ada@example.com',
                    group: 'item1',
                    params: { pref: 1 },
                    uid: expect.any(String),
                },
            ],
        });
    });

    it('sends no email property for a name-only contact', async () => {
        const { references, saveVCardContact, deps } = setUp(buildSavedContact({ ContactEmails: [] }));

        await createAddContactHandler(deps)(
            { name: 'Ada Lovelace', first_name: null, last_name: null, email: null },
            { references }
        );

        expect(saveVCardContact).toHaveBeenCalledWith(undefined, {
            fn: [{ field: 'fn', value: 'Ada Lovelace', params: { pref: 1 }, uid: expect.any(String) }],
        });
    });

    // The reference is minted from the ContactEmail, exactly as find_contacts mints it, so the model can
    // chain onto the contact it just created without re-reading the address book.
    it('mints the reference from the contact the server saved', async () => {
        const { references, deps } = setUp();

        const result: AddedContactResult = await createAddContactHandler(deps)(
            { name: 'ada lovelace', first_name: null, last_name: null, email: 'ada@example.com' },
            { references }
        );

        expect(result).toEqual({
            reference: expect.stringMatching(/^contact-[0-9a-z]{6}$/),
            name: 'Ada Lovelace',
            email: 'ada@example.com',
        });
        expect(references.idFor(result.reference as string)).toBe('CONTACT_EMAIL_ID');
    });

    it('reports a contact with no saved address without a reference', async () => {
        const { references, deps } = setUp(buildSavedContact({ ContactEmails: [] }));

        const result = await createAddContactHandler(deps)(
            { name: 'Ada Lovelace', first_name: null, last_name: null, email: null },
            { references }
        );

        expect(result).toEqual({ reference: undefined, name: 'Ada Lovelace', email: undefined });
    });

    // Without this the model is told only "the tool failed" and re-issues the same call, and the tool it
    // would need instead does not exist yet.
    it('tells the model the address is taken, rather than reporting a generic failure', async () => {
        const { references, deps, saveVCardContact } = setUp();
        saveVCardContact.mockRejectedValue(new SaveVCardContactError(API_CUSTOM_ERROR_CODES.ALREADY_EXISTS));

        await expect(
            createAddContactHandler(deps)(
                { name: 'Ada Lovelace', first_name: null, last_name: null, email: 'ada@example.com' },
                { references }
            )
        ).rejects.toThrow(/ada@example.com is already saved on another contact/);
    });

    it('leaves any other save failure alone', async () => {
        const { references, deps, saveVCardContact } = setUp();
        const failure = new SaveVCardContactError(null);
        saveVCardContact.mockRejectedValue(failure);

        await expect(
            createAddContactHandler(deps)(
                { name: 'Ada Lovelace', first_name: null, last_name: null, email: 'ada@example.com' },
                { references }
            )
        ).rejects.toBe(failure);
    });
});

describe('addContactCardRenderer', () => {
    it('disables Confirm on exactly what the handler would refuse', () => {
        expect(addContactCardRenderer.canApply?.({ name: 'Ada', email: null })).toBe(true);
        expect(addContactCardRenderer.canApply?.({ name: null, last_name: 'Lovelace' })).toBe(true);
        expect(addContactCardRenderer.canApply?.({ name: null, email: 'ada@example.com' })).toBe(true);
        expect(addContactCardRenderer.canApply?.({ name: '', first_name: '', last_name: '', email: '' })).toBe(false);
        expect(addContactCardRenderer.canApply?.({ name: 'Ada', email: 'ada@' })).toBe(false);
    });

    it('names the contact, and both fields when there are two', () => {
        expect(addContactCardRenderer.detail?.({ type: 'add_contact', name: 'Ada', email: null }, {})).toBe('Ada');
        expect(
            addContactCardRenderer.detail?.({ type: 'add_contact', name: 'Ada', email: 'ada@example.com' }, {})
        ).toBe('Ada · ada@example.com');
        expect(
            addContactCardRenderer.detail?.({ type: 'add_contact', first_name: 'Ada', last_name: 'Lovelace' }, {})
        ).toBe('Ada Lovelace');
    });
});

// The hand-off to the app's own contact editor: the payload arm `DrawerContactModals` destructures.
describe('openContactEditor', () => {
    it('posts the proposed contact as a vCard the editor opens prefilled', () => {
        const postMessage = jest.spyOn(window, 'postMessage').mockImplementation(() => {});

        openContactEditor({ name: 'Ada Lovelace', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' });

        expect(postMessage).toHaveBeenCalledWith(
            {
                type: DRAWER_EVENTS.OPEN_CONTACT_MODAL,
                payload: {
                    vCardContact: {
                        fn: [{ field: 'fn', value: 'Ada Lovelace', params: { pref: 1 }, uid: expect.any(String) }],
                        // Prefilled first/last name is the whole point of the hand-off: the editor asks for
                        // them separately and cannot derive them from the display name.
                        n: expect.objectContaining({
                            value: expect.objectContaining({ givenNames: ['Ada'], familyNames: ['Lovelace'] }),
                        }),
                        email: [
                            {
                                field: 'email',
                                value: 'ada@example.com',
                                group: 'item1',
                                params: { pref: 1 },
                                uid: expect.any(String),
                            },
                        ],
                    },
                },
            },
            window.location.origin
        );

        postMessage.mockRestore();
    });
});

describe('serializeForLumo', () => {
    const anyReferences = {} as ReferenceRegistry;

    it('carries the reference the model chains onto, and drops it when there is none', () => {
        expect(
            addContactDefinition.serializeForLumo(
                { reference: 'contact-x7b2q1', name: 'Ada Lovelace', email: 'ada@example.com' },
                anyReferences
            )
        ).toBe('Saved contact contact-x7b2q1 | "Ada Lovelace" | ada@example.com.');
        expect(addContactDefinition.serializeForLumo({ name: 'Ada Lovelace' }, anyReferences)).toBe(
            'Saved contact "Ada Lovelace".'
        );
    });
});
