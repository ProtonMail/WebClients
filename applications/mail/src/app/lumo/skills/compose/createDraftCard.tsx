import { c } from 'ttag';

import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';
import type { ActionRequest, ReferenceLabels } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import sentenceValue from '@proton/lumo-ui/primitives/sentenceValue';

import { DraftKind } from '../../helpers/draftKind';
import { recipientList, recipientName } from './cardHelpers';

const humanKind = (kind: DraftKind): string => {
    switch (kind) {
        case DraftKind.NEW:
            return c('Info').t`email`;
        case DraftKind.REPLY:
            return c('Info').t`reply`;
        case DraftKind.REPLY_ALL:
            return c('Info').t`reply all`;
        case DraftKind.FORWARD:
            return c('Info').t`forward`;
        default:
            return c('Info').t`email`;
    }
};

const CreateDraftBody = ({ action, labels }: { action: ActionRequest; labels: ReferenceLabels }) => {
    const cc = recipientList(action.cc, labels);
    const subject = action.kind === DraftKind.NEW ? (action.subject as string | undefined) : undefined;
    const body = action.body as string | undefined;

    return (
        <div>
            {cc && (
                <div className="flex gap-2 mb-1">
                    <span className="color-hint shrink-0">{c('Label').t`Cc`}</span>
                    <span>{cc}</span>
                </div>
            )}
            {subject && <div className="text-semibold mb-1">{subject}</div>}
            {body && (
                <div
                    className="color-weak mt-2 pl-3"
                    style={{ whiteSpace: 'pre-wrap', borderInlineStart: '2px solid var(--border-norm)' }}
                >
                    {body}
                </div>
            )}
        </div>
    );
};

export const createDraftCardRenderer: CardRenderer = {
    icon: IcPenSquare,
    sentence: (action, labels) => {
        const kind = sentenceValue(humanKind(action.kind as DraftKind));
        const firstTo = (action.to as string[] | undefined)?.[0];
        if (firstTo) {
            const recipient = sentenceValue(recipientName(firstTo, labels));
            // translator: e.g. "Draft an email to Alice" / "Draft a reply to Alice"
            return action.kind === DraftKind.NEW
                ? c('Info').jt`Draft an ${kind} to ${recipient}`
                : c('Info').jt`Draft a ${kind} to ${recipient}`;
        }
        // translator: e.g. "Draft an email" / "Draft a reply"
        return action.kind === DraftKind.NEW ? c('Info').jt`Draft an ${kind}` : c('Info').jt`Draft a ${kind}`;
    },
    renderBody: ({ action, labels }) => <CreateDraftBody action={action} labels={labels} />,
    detail: (action) => {
        const kind = humanKind(action.kind as DraftKind);
        // translator: e.g. "Drafted an email" / "Drafted a reply"
        return action.kind === DraftKind.NEW ? c('Info').t`Drafted an ${kind}` : c('Info').t`Drafted a ${kind}`;
    },
};
