import { c } from 'ttag';

import type { CardRenderer } from '@proton/components/components/lumoAgent/types';
import { IcStar } from '@proton/icons/icons/IcStar';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { MoveItemsCard } from '@proton/lumo-ui';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { APPLY_LOCATION_TYPES } from 'proton-mail/hooks/actions/applyLocation/interface';

import { resolveElements } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';

export interface SetStarredParams {
    ids: string[];
    /** Target state, not a toggle: true adds the star, false removes it. */
    starred: boolean;
}

export const setStarredDefinition: ToolDefinition<SetStarredParams, void> = {
    name: 'set_starred',
    kind: 'mutation',
    toolDescription:
        'Star or unstar one or more emails. `ids` are email-… references from view_emails/search. Set `starred` to true for "star/flag these", or false for "unstar/unflag these" or "remove the star". This SETS that state rather than toggling it, so it is safe on a mixed selection. The on-screen rows show which emails are starred: a row carrying `starred` is starred, and a row without it is not. Only pass emails that are not already in the state you are setting — if every email the user means is already in it, tell them there is nothing to do instead of proposing this. Starring and unstarring only change the star; they do not move the emails or alter anything else. Proposed to the user for confirmation before it runs.',
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['ids', 'starred'],
        properties: {
            ids: { type: 'array', items: { type: 'string' } },
            starred: { type: 'boolean' },
        },
    },
    examples: [
        {
            context:
                'view_emails returned `email-a1b2c3 | Acme | Booking confirmation | 2026-08-11 | read | Inbox` and `email-d4e5f6 | Acme | Receipt | 2026-08-11 | read | Inbox | starred`. The user asks to star the booking confirmation and the receipt; the receipt already shows `starred`, so only the other one is proposed.',
            call: { ids: ['email-a1b2c3'], starred: true },
        },
        {
            context:
                'The same rows are on screen and the user asks to unflag the receipt. Only the receipt carries `starred`, so it is the only one that needs unstarring.',
            call: { ids: ['email-d4e5f6'], starred: false },
        },
    ],
    // Surfaced via the confirm card, not the working set, so these stay trivial (see the shared contract).
    serializeForLumo: () => '',
    summarizeChip: ({ starred }) => ({
        label: starred ? c('Info').t`Star emails` : c('Info').t`Unstar emails`,
    }),
};

export const createSetStarredHandler =
    (mail: MailToolDeps): ToolHandler<SetStarredParams, void> =>
    async ({ ids, starred }, { references }) => {
        const elements = resolveElements(mail.store, ids, references);
        // `removeLabel` un-stars, so this sets an absolute state: an email already in the target state is
        // left as it is rather than flipped.
        await mail.applyLocation({
            type: APPLY_LOCATION_TYPES.STAR,
            elements,
            destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
            removeLabel: !starred,
        });
    };

/** No subtitle: unlike move_emails, there is no destination to show — the direction is in the title. */
export const setStarredCardRenderer: CardRenderer = {
    icon: IcStar,
    title: (action) => (action.starred ? c('Title').t`Star emails` : c('Title').t`Unstar emails`),
    renderBody: ({ action, params, labels, onChange }) => {
        const proposedIds = (action.ids as string[]) ?? [];
        const selectedIds = (params.ids as string[]) ?? [];
        return (
            <MoveItemsCard
                items={proposedIds.map((id) => ({ id, label: labels[id] ?? id }))}
                selectedIds={selectedIds}
                onToggle={(id, checked) =>
                    onChange({ ...params, ids: checked ? [...selectedIds, id] : selectedIds.filter((x) => x !== id) })
                }
            />
        );
    },
    detail: (action, labels) => {
        const proposedIds = (action.ids as string[]) ?? [];
        if (!proposedIds.length) {
            return undefined;
        }
        return proposedIds.map((id) => labels[id] ?? id).join(', ');
    },
};

export const setStarredModule: MailToolModule = {
    definition: setStarredDefinition,
    createHandler: createSetStarredHandler,
    cardRenderer: setStarredCardRenderer,
};
