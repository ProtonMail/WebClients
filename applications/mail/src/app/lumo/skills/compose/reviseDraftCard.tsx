import { c } from 'ttag';

import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';
import type { ActionRequest, ReferenceLabels } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import sentenceValue from '@proton/lumo-ui/primitives/sentenceValue';

import { recipientList } from './cardHelpers';

const ReviseDraftBody = ({ action, labels }: { action: ActionRequest; labels: ReferenceLabels }) => {
    const body = (action.body as string | undefined)?.trim();
    const to = recipientList(action.to, labels);
    const cc = recipientList(action.cc, labels);

    return (
        <div>
            {to && (
                <div className="flex gap-2 mb-1">
                    <span className="color-hint shrink-0">{c('Label').t`To`}</span>
                    <span>{to}</span>
                </div>
            )}
            {cc && (
                <div className="flex gap-2 mb-1">
                    <span className="color-hint shrink-0">{c('Label').t`Cc`}</span>
                    <span>{cc}</span>
                </div>
            )}
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

const detailText = (action: ActionRequest): string => {
    const hasBody = Boolean((action.body as string | undefined)?.trim());
    const hasRecipients = Boolean(
        (action.to as string[] | undefined)?.length || (action.cc as string[] | undefined)?.length
    );

    if (hasBody && hasRecipients) {
        return c('Info').t`Rewrote and readdressed`;
    }
    if (hasRecipients) {
        return c('Info').t`Readdressed`;
    }
    return c('Info').t`Rewrote the draft`;
};

export const reviseDraftCardRenderer: CardRenderer = {
    icon: IcPenSquare,
    sentence: () => {
        const draft = sentenceValue(c('Info').t`open draft`);
        // translator: e.g. "Revise the open draft"
        return c('Info').jt`Revise the ${draft}`;
    },
    renderBody: ({ action, labels }) => <ReviseDraftBody action={action} labels={labels} />,
    detail: (action) => detailText(action),
};
