import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { SaveVCardContactError } from '@proton/components/containers/contacts/hooks/useSaveVCardContact';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ActionRequest, ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { CardBodyProps, CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import sentenceValue from '@proton/lumo-ui/primitives/sentenceValue';
import { createContactPropertyUid } from '@proton/shared/lib/contacts/properties';
import { prepareForSaving } from '@proton/shared/lib/contacts/surgery';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

import type { MailToolDeps, MailToolModule } from '../../toolModule';

export interface AddContactParams {
    name: string | null;
    /**
     * Split by the MODEL, never here: "Ada Lovelace" splits on a space but "Jing Yang" and "van der Berg"
     * do not, and a wrong split writes a wrong given name into a field the user then has to correct.
     */
    first_name: string | null;
    last_name: string | null;
    email: string | null;
}

/** What the address book was actually given, once the model's arguments have been trimmed and defaulted. */
interface ContactInput {
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
}

export interface AddedContactResult {
    /** Absent for a contact saved without an address: a contact reference names one saved email. */
    reference?: string;
    name: string;
    email?: string;
}

const FREE_TEXT_PARAMS = ['name', 'first_name', 'last_name', 'email'] as const;

const trimmed = (value: string | null): string => value?.trim() ?? '';

/** The display name the contact list shows, which vCard requires — the editor computes it the same way. */
const displayName = ({ name, first_name, last_name, email }: AddContactParams): string =>
    trimmed(name) || `${trimmed(first_name)} ${trimmed(last_name)}`.trim() || trimmed(email);

/**
 * The one question the card and the handler both ask, so Confirm is disabled on exactly what the handler
 * would reject. The message is model-facing: it names what was wrong and what to send instead.
 */
const describeContactProblem = (params: AddContactParams): string | undefined => {
    if (!displayName(params)) {
        return 'A contact needs at least a name or an email address, and every field was empty. Send `name`, `first_name`, `last_name` or `email` — ask the user for one if you do not have it.';
    }
    const email = trimmed(params.email);
    if (email && !validateEmailAddress(email)) {
        return `"${email}" is not a valid email address. Send a complete address such as "ada@example.com", or null if the user did not give one.`;
    }

    return undefined;
};

/**
 * An address saved under itself is displayed as the address alone (`getContactDisplayNameEmail`), so
 * falling back to it costs the user nothing and keeps `fn` filled.
 */
export const resolveContactInput = (params: AddContactParams): ContactInput => {
    const problem = describeContactProblem(params);
    if (problem) {
        throw new ToolInputError(problem);
    }

    return {
        name: displayName(params),
        ...(trimmed(params.first_name) ? { firstName: trimmed(params.first_name) } : {}),
        ...(trimmed(params.last_name) ? { lastName: trimmed(params.last_name) } : {}),
        ...(trimmed(params.email) ? { email: trimmed(params.email) } : {}),
    };
};

/**
 * `prepareForSaving` is what the import path runs before this same `addContacts` call: it groups the email
 * property and numbers its `pref`. The contact editor does neither, because its own later screens assign
 * them — screens a contact created here never passes through.
 */
const toVCardContact = ({ name, firstName, lastName, email }: ContactInput): VCardContact =>
    prepareForSaving({
        fn: [{ field: 'fn', value: name, uid: createContactPropertyUid() }],
        ...(firstName || lastName
            ? {
                  n: {
                      field: 'n',
                      value: {
                          familyNames: [lastName ?? ''],
                          givenNames: [firstName ?? ''],
                          additionalNames: [''],
                          honorificPrefixes: [''],
                          honorificSuffixes: [''],
                      },
                      uid: createContactPropertyUid(),
                  },
              }
            : {}),
        ...(email ? { email: [{ field: 'email', value: email, uid: createContactPropertyUid() }] } : {}),
    });

/**
 * The address book rejects an address it already holds, and that conflict is the one failure the model can
 * act on — every other one reaches it as a generic failure it must not retry. `add_contact` cannot resolve
 * it either way: editing the existing contact is not this tool's job.
 */
const saveNewContact = async (mail: MailToolDeps, input: ContactInput) => {
    try {
        return await mail.saveVCardContact(undefined, toVCardContact(input));
    } catch (error) {
        if (error instanceof SaveVCardContactError && error.code === API_CUSTOM_ERROR_CODES.ALREADY_EXISTS) {
            throw new ToolInputError(
                `${input.email} is already saved on another contact, so nothing was created. add_contact only creates new contacts — it cannot edit or merge one. Tell the user the contact already exists; do not retry.`
            );
        }
        throw error;
    }
};

/** Reads back the contact the SERVER saved, so the reference and the name it carries exist as stated. */
export const createAddContactHandler =
    (mail: MailToolDeps): ToolHandler<AddContactParams, AddedContactResult> =>
    async (params, { references }) => {
        const input = resolveContactInput(params);
        const saved = await saveNewContact(mail, input);
        const savedEmail = saved?.ContactEmails?.[0];

        return {
            name: saved?.Name ?? input.name,
            email: savedEmail?.Email ?? input.email,
            reference: savedEmail
                ? references.referenceFor('contact', savedEmail.ID, {
                      title: savedEmail.Name,
                      subtitle: savedEmail.Email,
                  })
                : undefined,
        };
    };

export const addContactDefinition: ToolDefinition<AddContactParams, AddedContactResult> = {
    name: 'add_contact',
    kind: 'mutation',
    toolDescription:
        'Save a NEW contact to the address book. `name` is the contact as it should be listed and `email` their address. Also split the name into `first_name` and `last_name` whenever you can tell which part is which, so the contact is saved with the same structured fields the user would fill in by hand; send null for both when the name is a single word, a company or a name whose order you are unsure of. Send null for anything you were not given, but not for all of them. Creates only: it cannot edit, rename, merge or add an address to a contact that already exists, and the address book refuses an email address it already holds. So call find_contacts first whenever the person might already be saved, and if they are, tell the user rather than calling this. The result carries the new contact\'s contact-… reference. Proposed to the user for confirmation before it runs. Example: { "name": "Ada Lovelace", "first_name": "Ada", "last_name": "Lovelace", "email": "ada@example.com" }.',
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'first_name', 'last_name', 'email'],
        properties: {
            name: { type: ['string', 'null'] },
            first_name: { type: ['string', 'null'] },
            last_name: { type: ['string', 'null'] },
            email: { type: ['string', 'null'] },
        },
    },
    freeTextParams: FREE_TEXT_PARAMS,
    examples: [
        {
            context: 'The user asks you to save Ada Lovelace, whose address they gave as ada@example.com.',
            call: { name: 'Ada Lovelace', first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' },
        },
        {
            context:
                'The user asks you to save the sender of an email they are reading, and read_email gave only the address.',
            call: { name: null, first_name: null, last_name: null, email: 'billing@hotel.example' },
        },
        {
            context: 'The user asks you to save their hotel, whose name is not a personal name to split.',
            call: {
                name: 'Hotel Bellevue',
                first_name: null,
                last_name: null,
                email: 'reception@bellevue.example',
            },
        },
    ],
    serializeForLumo: ({ reference, name, email }) => {
        const identity = email ? `"${name}" | ${email}` : `"${name}"`;

        return reference ? `Saved contact ${reference} | ${identity}.` : `Saved contact ${identity}.`;
    },
    summarizeChip: () => ({ label: c('Info').t`Add contact` }),
};

const contactParams = (source: ActionRequest | Record<string, any>): AddContactParams => ({
    name: (source.name as string | null) ?? null,
    first_name: (source.first_name as string | null) ?? null,
    last_name: (source.last_name as string | null) ?? null,
    email: (source.email as string | null) ?? null,
});

/**
 * Hands the proposed contact to the app's own contact editor, over the same-window postMessage seam
 * `DrawerContactModals` listens on — the way to reach every field this card deliberately does not carry
 * (phone, address, note). The user then saves it there; the card's own Confirm is the alternative, not a
 * follow-up, and confirming afterwards fails as a duplicate.
 */
export const openContactEditor = (input: ContactInput) => {
    window.postMessage(
        { type: DRAWER_EVENTS.OPEN_CONTACT_MODAL, payload: { vCardContact: toVCardContact(input) } },
        window.location.origin
    );
};

const describeContact = (source: ActionRequest | Record<string, any>): string | undefined => {
    const params = contactParams(source);
    const name = displayName(params);
    if (!name) {
        return undefined;
    }
    const email = trimmed(params.email);

    return email && email !== name ? `${name} · ${email}` : name;
};

const canApply = (params: Record<string, any>): boolean => !describeContactProblem(contactParams(params));

const renderAddContactBody = ({ params, onChange }: CardBodyProps) => {
    // Destructured under their wire names, which the model chose and the params object keys on.
    const { name, first_name: firstName, last_name: lastName, email } = contactParams(params);

    return (
        <div className="flex flex-column gap-2">
            <InputFieldTwo
                label={c('Label').t`First name`}
                value={firstName ?? ''}
                onValue={(value: string) => onChange({ ...params, first_name: value })}
            />
            <InputFieldTwo
                label={c('Label').t`Last name`}
                value={lastName ?? ''}
                onValue={(value: string) => onChange({ ...params, last_name: value })}
            />
            <InputFieldTwo
                label={c('Label').t`Display name`}
                value={name ?? ''}
                onValue={(value: string) => onChange({ ...params, name: value })}
            />
            <InputFieldTwo
                label={c('Label').t`Email`}
                type="email"
                value={email ?? ''}
                onValue={(value: string) => onChange({ ...params, email: value })}
            />
            <Button
                shape="underline"
                color="norm"
                className="self-start"
                disabled={!canApply(params)}
                onClick={() => openContactEditor(resolveContactInput(contactParams(params)))}
            >
                {c('Action').t`Add more details`}
            </Button>
        </div>
    );
};

export const addContactCardRenderer: CardRenderer = {
    icon: IcUserPlus,
    sentence: (action) => {
        const described = describeContact(action);
        if (!described) {
            return c('Info').t`Add a contact`;
        }
        const contact = sentenceValue(described);

        return c('Info').jt`Add ${contact} to your contacts`;
    },
    renderBody: renderAddContactBody,
    canApply,
    detail: describeContact,
};

export const addContactModule: MailToolModule = {
    definition: addContactDefinition,
    createHandler: createAddContactHandler,
    cardRenderer: addContactCardRenderer,
};
