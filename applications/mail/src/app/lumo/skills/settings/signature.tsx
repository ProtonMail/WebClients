import { c } from 'ttag';

import SettingsLinkBody from '@proton/components/components/lumoAgent/cardBodies/SettingsLinkBody';
import TextFieldBody from '@proton/components/components/lumoAgent/cardBodies/TextFieldBody';
import type { CardBodyProps, CardRenderer } from '@proton/components/components/lumoAgent/types';
import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { toText } from '@proton/mail/helpers/parserHtml';
import { htmlEntities, replaceLineBreaks } from '@proton/mail/helpers/string';
import { getPrimaryAddress } from '@proton/shared/lib/helpers/address';

import type { MailToolDeps, MailToolModule } from '../../toolModule';

/** The only param, carrying the user's own words — so, per the reference guard, a free-text one. */
export enum ChangeSignatureField {
    TEXT = 'text',
}

const SIGNATURE_FIELD_ROWS = 5;

/** The `Signature` field stores HTML, while both signature tools speak plain text. */
const toStoredHtml = (text: string): string => replaceLineBreaks(htmlEntities(text.trim()));

const toPlainText = (html: string): string => toText(html).trim();

export interface ReadSignatureResult {
    signature: string;
    isSetWithoutText: boolean;
}

export const readSignatureDefinition: ToolDefinition<Record<string, never>, ReadSignatureResult> = {
    name: 'read_signature',
    kind: 'read',
    toolDescription:
        'Read the signature appended to the mail the user sends, on their primary address, as plain text. Use it to answer questions about the current signature, and before EDITING one — adding or changing a line — so you can send the whole thing back. You do not need it before replacing or removing the signature: change_signature reads the stored value itself. The signature is stored as HTML and is flattened to plain text here, so one with links, images or styling reads back incomplete — never present it as the exact, authoritative signature, and never offer to reproduce formatting you cannot see. Read-only.',
    paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    serializeForLumo: (result) => {
        if (result.signature) {
            return `Current signature, flattened to plain text (any rich formatting is not shown):\n${result.signature}`;
        }
        if (result.isSetWithoutText) {
            return 'A signature was set when this call ran, but it held no text at all — only images or other rich content — so none of it could be shown here.';
        }
        return 'No signature is set.';
    },
    summarizeChip: () => ({ label: c('Info').t`Read your signature` }),
};

const createReadSignatureHandler =
    (mail: MailToolDeps): ToolHandler<Record<string, never>, ReadSignatureResult> =>
    async () => {
        const stored = getPrimaryAddress(mail.getAddresses())?.Signature ?? '';
        const signature = toPlainText(stored);

        return { signature, isSetWithoutText: !signature && Boolean(stored.trim()) };
    };

export const readSignatureModule: MailToolModule = {
    definition: readSignatureDefinition,
    createHandler: createReadSignatureHandler,
};

export interface ChangeSignatureParams {
    /** The whole new signature, as plain text; newlines are kept. */
    text: string;
}

export const changeSignatureDefinition: ToolDefinition<ChangeSignatureParams, void> = {
    name: 'change_signature',
    kind: 'mutation',
    toolDescription:
        'Set the signature appended to the mail the user sends, on their primary address. `text` is the whole signature as plain text (newlines allowed) and REPLACES the stored one; `text: ""` removes it, which is what "turn it off" or "no signature" means. Use EXACTLY the wording the user gives: do NOT invent, suggest or offer example signature text, and do NOT write HTML. You do NOT need to read the signature first to replace or remove it — this tool reads the stored value itself and refuses a write that would leave the signature reading exactly as it does now; read_signature first only when EDITING one, so you can send the whole signature back with the change. Rich formatting is offered on the confirm card itself, so never mention or link to the advanced settings in your reply. Proposed to the user for confirmation before it runs.',
    // The user's own words, so exempt from the reference guard — a signature reading "Bob | dev-team42"
    // would otherwise be rejected as an unknown reference.
    freeTextParams: Object.values(ChangeSignatureField),
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['text'],
        properties: { text: { type: 'string' } },
    },
    examples: [
        {
            context:
                'read_signature reported "Bob Smith\\nAcme Ltd" and the user asks to add their phone number under it. The whole signature is re-sent, in the user\'s own wording.',
            call: { text: 'Bob Smith\nAcme Ltd\n+44 20 7946 0111' },
        },
        {
            context: 'The user asks to turn their signature off. Removing it is an empty text.',
            call: { text: '' },
        },
    ],
    // Nothing to feed back: what was applied is surfaced by the settled card, not by the working set.
    serializeForLumo: () => '',
    summarizeChip: () => ({ label: c('Info').t`Set signature` }),
};

/**
 * A removal is judged on the stored markup, since a signature of only images or styling flattens to no
 * text and would otherwise be unremovable. Anything else is judged as plain text — the only form this
 * tool can express — so a write differing only in markup is refused rather than silently flattening a
 * rich signature, and says so.
 */
const noOpRefusal = (stored: string, signature: string): string | undefined => {
    if (!signature) {
        return stored.trim()
            ? undefined
            : 'Nothing was changed: there was no signature to remove when this call ran. That was its value only then.';
    }
    if (toPlainText(stored) !== toPlainText(signature)) {
        return undefined;
    }
    if (stored.trim() === signature) {
        return 'Nothing was changed: that was already the stored signature when this call ran. That was its value only then.';
    }
    return 'Nothing was changed: the stored signature already read exactly that way when this call ran, and differed only in formatting this tool cannot express, such as bold text, links or images. Changing that formatting needs the signature settings.';
};

const createChangeSignatureHandler =
    (mail: MailToolDeps): ToolHandler<ChangeSignatureParams, void> =>
    async ({ text }) => {
        const address = getPrimaryAddress(mail.getAddresses());
        if (!address) {
            throw new ToolInputError(
                'Nothing was changed: there was no active address to set a signature on when this call ran.'
            );
        }
        const signature = toStoredHtml(text);
        const refusal = noOpRefusal(address.Signature ?? '', signature);
        if (refusal) {
            throw new ToolInputError(refusal);
        }
        // `updateAddress` PUTs the whole identity, so the display name is resent from the address just
        // read rather than from anything captured earlier.
        await mail.updateAddress({ address, displayName: address.DisplayName, signature });
    };

const signatureText = (params: Record<string, any>): string => String(params[ChangeSignatureField.TEXT] ?? '');

/** The settings link lives on the card, never in Lumo's prose: richer editing is findable without being pushed. */
const SignatureBody = ({ params, onChange }: CardBodyProps) => (
    <>
        <TextFieldBody
            label={c('Label').t`Signature`}
            value={signatureText(params)}
            onChange={(text) => onChange({ ...params, [ChangeSignatureField.TEXT]: text })}
            rows={SIGNATURE_FIELD_ROWS}
        />
        <SettingsLinkBody path="/identity-addresses" label={c('Link').t`Add formatting, links or images`} />
    </>
);

export const changeSignatureCardRenderer: CardRenderer = {
    icon: IcPenSquare,
    title: () => c('Title').t`Set signature`,
    renderBody: (props) => <SignatureBody {...props} />,
    // The settled tile is handed the params that ran, so this names what was applied, not what was offered.
    detail: (action) => signatureText(action).trim().split('\n')[0] || undefined,
};

export const changeSignatureModule: MailToolModule = {
    definition: changeSignatureDefinition,
    createHandler: createChangeSignatureHandler,
    cardRenderer: changeSignatureCardRenderer,
};
