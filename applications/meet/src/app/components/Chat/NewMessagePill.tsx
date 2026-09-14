import { c, msgid } from 'ttag';

import { IcArrowDown } from '@proton/icons/icons/IcArrowDown';
import { IcAt } from '@proton/icons/icons/IcAt';
import { IcCross } from '@proton/icons/icons/IcCross';

interface NewMessagePillProps {
    newMessageCount: number;
    newMentionCount: number;
    onScrollToBottom: () => void;
    onDismiss: () => void;
}

export const NewMessagePill = ({
    newMessageCount,
    newMentionCount,
    onScrollToBottom,
    onDismiss,
}: NewMessagePillProps) => {
    const hasMentions = newMentionCount > 0;

    return (
        <div className="new-message-pill text-semibold flex items-center flex-nowrap shrink-0 mb-2 rounded-full border bg-primary py-1.5 pl-2 gap-2 cursor-pointer">
            <button
                type="button"
                className="flex items-center flex-nowrap gap-1 rounded-full border-none bg-transparent py-1 h-full"
                onClick={onScrollToBottom}
            >
                <IcArrowDown size={4} className="shrink-0" stroke="currentColor" strokeWidth={0.5} />
                {hasMentions && <IcAt size={4} className="shrink-0" />}
                <span className="text-sm text-nowrap">
                    {hasMentions
                        ? c('Action').ngettext(
                              msgid`${newMentionCount} new mention`,
                              `${newMentionCount} new mentions`,
                              newMentionCount
                          )
                        : c('Action').ngettext(
                              msgid`${newMessageCount} new`,
                              `${newMessageCount} new`,
                              newMessageCount
                          )}
                </span>
            </button>
            <button
                type="button"
                className="flex items-center justify-center shrink-0 rounded-full border-none bg-transparent hover:color-norm"
                onClick={onDismiss}
                aria-label={hasMentions ? c('Action').t`Dismiss new mentions` : c('Action').t`Dismiss new messages`}
            >
                <IcCross size={4} stroke="currentColor" strokeWidth={0.5} />
            </button>
        </div>
    );
};
