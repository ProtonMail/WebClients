import { c } from 'ttag';

import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type {
    ActionRequest,
    ReferenceLabels,
    ToolDefinition,
    ToolHandler,
} from '@proton/llm/lib/lumoAgent/contracts/types';
import type { CardBodyProps, CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import sentenceValue from '@proton/lumo-ui/primitives/sentenceValue';
import { createContactPropertyUid } from '@proton/shared/lib/contacts/properties';
import { prepareForSaving } from '@proton/shared/lib/contacts/surgery';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { VCardContact, VcardNValue } from '@proton/shared/lib/interfaces/contacts/VCard';

import { resolveTypedId } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import type { AddedContactResult } from './addContact';
import { saveWithDuplicateGuard, trimmed } from './contactHelpers';
import { recordedName } from './emailSelection';

export interface UpdateContactParams {
    contact: string;
    name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
}

const FREE_TEXT_PARAMS = ['name', 'first_name', 'last_name', 'email'] as const;

const emptyToNull = (value: string | null | undefined): string | null => {
    if (value == null) {
        return null;
    }
    return value.trim() ? value : null;
};

const hasContent = (value: string | null): boolean => value !== null && value.trim().length > 0;

const describeUpdateProblem = (params: UpdateContactParams): string | undefined => {
    if (params.name === null && params.first_name === null && params.last_name === null && params.email === null) {
        return 'At least one of `name`, `first_name`, `last_name` or `email` must be non-null — send only the fields to change.';
    }
    if (
        !hasContent(params.name) &&
        !hasContent(params.first_name) &&
        !hasContent(params.last_name) &&
        !hasContent(params.email)
    ) {
        return 'All provided fields are blank after trimming. Send at least one non-empty value, or null to leave a field unchanged.';
    }
    const email = trimmed(params.email);
    if (email && !validateEmailAddress(email)) {
        return `"${email}" is not a valid email address. Send a complete address such as "ada@example.com", or null to leave the current one.`;
    }

    return undefined;
};

const ensureNProperty = (vCard: VCardContact): VCardContact & { n: NonNullable<VCardContact['n']> } => {
    if (vCard.n) {
        return vCard as VCardContact & { n: NonNullable<VCardContact['n']> };
    }

    const emptyN: VcardNValue = {
        familyNames: [''],
        givenNames: [''],
        additionalNames: [''],
        honorificPrefixes: [''],
        honorificSuffixes: [''],
    };

    return { ...vCard, n: { field: 'n', value: emptyN, uid: createContactPropertyUid() } };
};

const findEmailIndex = (vCard: VCardContact, targetEmail: string): number => {
    const idx = vCard.email?.findIndex((e) => e.value.toLowerCase() === targetEmail.toLowerCase()) ?? -1;
    return idx >= 0 ? idx : 0;
};

const fieldsMatch = (params: UpdateContactParams, vCard: VCardContact, targetEmail: string): boolean => {
    if (params.name !== null && trimmed(params.name) !== (vCard.fn[0]?.value ?? '')) {
        return false;
    }
    if (params.first_name !== null && trimmed(params.first_name) !== (vCard.n?.value.givenNames[0] ?? '')) {
        return false;
    }
    if (params.last_name !== null && trimmed(params.last_name) !== (vCard.n?.value.familyNames[0] ?? '')) {
        return false;
    }
    if (params.email !== null) {
        const idx = findEmailIndex(vCard, targetEmail);
        if (trimmed(params.email) !== (vCard.email?.[idx]?.value ?? '')) {
            return false;
        }
    }

    return true;
};

const noopMessage = (params: UpdateContactParams): string => {
    const parts: string[] = [];
    if (params.name !== null) {
        parts.push(`name "${trimmed(params.name)}"`);
    }
    if (params.first_name !== null) {
        parts.push(`first name "${trimmed(params.first_name)}"`);
    }
    if (params.last_name !== null) {
        parts.push(`last name "${trimmed(params.last_name)}"`);
    }
    if (params.email !== null) {
        parts.push(`email ${trimmed(params.email)}`);
    }

    return `Nothing was changed: the contact already has ${parts.join(', ')} when this call ran.`;
};

const mergeVCard = (params: UpdateContactParams, existing: VCardContact, targetEmail: string): VCardContact => {
    let merged = { ...existing };

    if (params.name !== null) {
        const base = merged.fn[0] ?? { field: 'fn' as const, uid: createContactPropertyUid() };
        merged = {
            ...merged,
            fn: [{ ...base, value: trimmed(params.name) }, ...merged.fn.slice(1)],
        };
    }

    if (params.first_name !== null || params.last_name !== null) {
        const withN = ensureNProperty(merged);
        const nValue = { ...withN.n.value };
        if (params.first_name !== null) {
            nValue.givenNames = [trimmed(params.first_name)];
        }
        if (params.last_name !== null) {
            nValue.familyNames = [trimmed(params.last_name)];
        }
        merged = { ...withN, n: { ...withN.n, value: nValue } };
    }

    if (params.email !== null) {
        const existingEmails = merged.email ?? [];
        const idx = findEmailIndex(merged, targetEmail);
        const emailProp = existingEmails[idx]
            ? { ...existingEmails[idx], value: trimmed(params.email) }
            : { field: 'email' as const, value: trimmed(params.email), uid: createContactPropertyUid() };
        const updatedEmails = [...existingEmails];
        updatedEmails[idx] = emailProp;
        merged = { ...merged, email: updatedEmails };
    }

    return merged;
};

const saveUpdatedContact = (mail: MailToolDeps, contactID: string, vCard: VCardContact) =>
    saveWithDuplicateGuard(
        () => mail.saveVCardContact(contactID, prepareForSaving(vCard)),
        'That email address is already saved on another contact, so nothing was changed. Tell the user the address is taken; do not retry.'
    );

export const createUpdateContactHandler =
    (mail: MailToolDeps): ToolHandler<UpdateContactParams, AddedContactResult> =>
    async (rawParams, { references }) => {
        const contactEmailID = resolveTypedId(rawParams.contact, ['contact'], references);

        const contactEmail = mail.getContactEmails().find((ce) => ce.ID === contactEmailID);
        if (!contactEmail) {
            throw new ToolInputError(
                `Contact ${rawParams.contact} is no longer in the address book. Call find_contacts to get the current list.`
            );
        }

        const params: UpdateContactParams = {
            ...rawParams,
            name: emptyToNull(rawParams.name),
            first_name: emptyToNull(rawParams.first_name),
            last_name: emptyToNull(rawParams.last_name),
            email: emptyToNull(rawParams.email),
        };

        const problem = describeUpdateProblem(params);
        if (problem) {
            throw new ToolInputError(problem);
        }

        const contactID = contactEmail.ContactID;
        const existing = await mail.getFullContact(contactID);
        const targetEmail = contactEmail.Email;

        if (fieldsMatch(params, existing, targetEmail)) {
            throw new ToolInputError(noopMessage(params));
        }

        const merged = mergeVCard(params, existing, targetEmail);
        const saved = await saveUpdatedContact(mail, contactID, merged);
        const savedEmail = saved?.ContactEmails?.find((ce) => ce.ID === contactEmailID) ?? saved?.ContactEmails?.[0];

        return {
            name: saved?.Name ?? merged.fn[0]?.value ?? contactEmail.Name,
            email:
                savedEmail?.Email ?? merged.email?.[findEmailIndex(merged, targetEmail)]?.value ?? contactEmail.Email,
            reference: savedEmail
                ? references.referenceFor('contact', savedEmail.ID, {
                      title: savedEmail.Name,
                      subtitle: savedEmail.Email,
                  })
                : undefined,
        };
    };

export const updateContactDefinition: ToolDefinition<UpdateContactParams, AddedContactResult> = {
    name: 'update_contact',
    kind: 'mutation',
    toolDescription:
        "Edit an existing contact's name or email. `contact` is a contact-… reference from find_contacts. Send only the fields to change — null leaves a field as it is. Cannot create a new contact (use add_contact for that). The address book refuses a duplicate email address.",
    freeTextParams: FREE_TEXT_PARAMS,
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['contact', 'name', 'first_name', 'last_name', 'email'],
        properties: {
            contact: { type: 'string' },
            name: { type: ['string', 'null'] },
            first_name: { type: ['string', 'null'] },
            last_name: { type: ['string', 'null'] },
            email: { type: ['string', 'null'] },
        },
    },
    examples: [
        {
            context:
                "The user asks you to change Ada Lovelace's email to ada@newdomain.com. find_contacts returned contact-x7b2q1.",
            call: {
                contact: 'contact-x7b2q1',
                name: null,
                first_name: null,
                last_name: null,
                email: 'ada@newdomain.com',
            },
        },
        {
            context: 'The user asks you to rename contact-x7b2q1 to Augusta Ada King and update the split name.',
            call: {
                contact: 'contact-x7b2q1',
                name: 'Augusta Ada King',
                first_name: 'Augusta Ada',
                last_name: 'King',
                email: null,
            },
        },
    ],
    serializeForLumo: ({ reference, name, email }) => {
        const identity = email ? `"${name}" | ${email}` : `"${name}"`;

        return reference ? `Updated contact ${reference} | ${identity}.` : `Updated contact ${identity}.`;
    },
    summarizeChip: () => ({ label: c('Info').t`Edit contact` }),
};

const contactParams = (source: ActionRequest | Record<string, any>): UpdateContactParams => ({
    contact: (source.contact as string) ?? '',
    name: emptyToNull(source.name as string | null),
    first_name: emptyToNull(source.first_name as string | null),
    last_name: emptyToNull(source.last_name as string | null),
    email: emptyToNull(source.email as string | null),
});

const canApply = (params: Record<string, any>): boolean => {
    const parsed = contactParams(params);

    return !describeUpdateProblem(parsed);
};

const describeContact = (action: ActionRequest, labels: ReferenceLabels): string | undefined =>
    recordedName(action.contact, labels);

const renderUpdateContactBody = ({ params, onChange }: CardBodyProps) => {
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
        </div>
    );
};

export const updateContactCardRenderer: CardRenderer = {
    icon: IcPenSquare,
    sentence: (action, labels) => {
        const named = recordedName(action.contact, labels);
        if (!named) {
            return c('Info').t`Edit a contact`;
        }
        const contact = sentenceValue(named);

        return c('Info').jt`Edit ${contact}`;
    },
    renderBody: renderUpdateContactBody,
    canApply,
    detail: describeContact,
};

export const updateContactModule: MailToolModule = {
    definition: updateContactDefinition,
    createHandler: createUpdateContactHandler,
    cardRenderer: updateContactCardRenderer,
};
