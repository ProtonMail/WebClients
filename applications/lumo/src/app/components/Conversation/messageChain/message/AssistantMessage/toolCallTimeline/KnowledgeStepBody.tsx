import { c, msgid } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';

import { useLumoSelector } from '../../../../../../redux/hooks';
import { LumoLink } from '../../../../../Links/LumoLink';
import { LumoIcon } from '../../../../../LumoIcon/LumoIcon';
import type { KnowledgeItem, KnowledgeStepDetails } from './knowledgeStepDetails';

/** "2026-10-23" as a short local date, with the year only when it isn't this year's. */
function formatDay(day: string | undefined): string | undefined {
    const match = day?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return day;
    }
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const sameYear = date.getFullYear() === new Date().getFullYear();
    return date.toLocaleDateString(dateLocale.code, {
        day: 'numeric',
        month: 'short',
        ...(!sameYear && { year: 'numeric' }),
    });
}

const chatTitle = (item: Extract<KnowledgeItem, { kind: 'chat' }>) =>
    item.inThisChat
        ? // translator: Where a message found by the assistant comes from: the chat the user is in.
          c('collider_2025:Reasoning').t`This chat`
        : (item.title ??
          // translator: Where a message found by the assistant comes from: another chat that has no title.
          c('collider_2025:Reasoning').t`Untitled chat`);

/** Opens the chat a message belongs to; plain text if the chat is gone or ghost. */
const ChatTitle = ({ item }: { item: Extract<KnowledgeItem, { kind: 'chat' }> }) => {
    const messageId = item.messageId;
    const conversationId = useLumoSelector((state) => {
        const id = messageId ? state.messages[messageId]?.conversationId : undefined;
        const conversation = id ? state.conversations[id] : undefined;
        return conversation && !conversation.ghost ? conversation.id : undefined;
    });
    const title = <span className="text-ellipsis">{chatTitle(item)}</span>;
    if (!conversationId) {
        return title;
    }
    return (
        <LumoLink to={`/c/${conversationId}`} className="min-w-0 flex">
            <span className="text-ellipsis hover:underline">{chatTitle(item)}</span>
        </LumoLink>
    );
};

function itemDetail(item: KnowledgeItem): string | undefined {
    if (item.kind === 'chat') {
        return formatDay(item.date);
    }
    if (item.page !== undefined && item.pages !== undefined && item.pages > 1) {
        const { page, pages } = item;
        // translator: Which page of a file the assistant found or read, e.g. "page 2 of 5".
        return c('collider_2025:Reasoning').t`page ${page} of ${pages}`;
    }
    return undefined;
}

const KnowledgeItemRow = ({ item }: { item: KnowledgeItem }) => {
    const detail = itemDetail(item);
    return (
        <li className="flex flex-nowrap items-center gap-1.5 min-w-0 text-sm lh130">
            <LumoIcon
                name={item.kind === 'chat' ? 'MessageSquare' : 'FileText'}
                size={12}
                className="color-weak shrink-0"
            />
            <span className="flex flex-nowrap min-w-0 color-norm">
                {item.kind === 'chat' ? <ChatTitle item={item} /> : <span className="text-ellipsis">{item.name}</span>}
            </span>
            {detail && <span className="color-weak shrink-0">{detail}</span>}
        </li>
    );
};

/** What a knowledge lookup searched for and what it found or read, under the step's label. */
export const KnowledgeStepBody = ({ details }: { details: KnowledgeStepDetails }) => {
    const { query, items, more, noMatches } = details;
    if (!query && items.length === 0 && !noMatches) {
        return null;
    }
    return (
        <div className="thinking-step-body flex flex-column gap-1 min-w-0 mt-0.5">
            {query && (
                <p className="m-0 flex flex-nowrap items-center gap-1.5 min-w-0 text-sm lh130 color-weak">
                    <LumoIcon name="Search" size={12} className="shrink-0" />
                    <span className="text-ellipsis">{query}</span>
                </p>
            )}
            {items.length > 0 && (
                <ul className="unstyled m-0 p-0 flex flex-column gap-1 min-w-0">
                    {items.map((item, index) => (
                        <KnowledgeItemRow key={index} item={item} />
                    ))}
                </ul>
            )}
            {noMatches && (
                <p className="m-0 text-sm lh130 color-weak">
                    {
                        // translator: Assistant activity detail: a search of the user's files and chats found nothing.
                        c('collider_2025:Reasoning').t`No matches`
                    }
                </p>
            )}
            {more > 0 && (
                <p className="m-0 text-sm lh130 color-weak">
                    {
                        // translator: After a list of files and chats the assistant found, e.g. "and 3 more".
                        c('collider_2025:Reasoning').ngettext(msgid`and ${more} more`, `and ${more} more`, more)
                    }
                </p>
            )}
        </div>
    );
};
