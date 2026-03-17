import { useLocalParticipant } from '@livekit/components-react';
import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectChatMessageReactions } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { selectParticipantNameMap } from '@proton/meet/store/slices/meetingInfo';
import clsx from '@proton/utils/clsx';

import './ChatMessageReactions.scss';

const MAX_TOOLTIP_PARTICIPANTS = 50;

interface ChatMessageReactionsProps {
    messageId: string;
    onReact: (emoji: string) => void;
}

export const ChatMessageReactions = ({ messageId, onReact }: ChatMessageReactionsProps) => {
    const reactions = useMeetSelector((state) => selectChatMessageReactions(state, messageId));
    const participantNameMap = useMeetSelector(selectParticipantNameMap);
    const { localParticipant } = useLocalParticipant();

    const entries = Object.entries(reactions);

    if (entries.length === 0) {
        return null;
    }

    return (
        <div className="chat-message-reactions flex flex-wrap gap-1 mt-1">
            {entries.map(([emoji, identities]) => {
                const hasReacted = identities.includes(localParticipant.identity);
                const displayedParticipants = identities.slice(0, MAX_TOOLTIP_PARTICIPANTS);
                const hasMore = identities.length > MAX_TOOLTIP_PARTICIPANTS;

                const reactorNames = (
                    <span key="reactor-names">
                        {displayedParticipants.map((identity, index) => (
                            <span key={identity}>
                                {index > 0 && ', '}
                                <strong>{participantNameMap[identity] ?? identity}</strong>
                            </span>
                        ))}
                    </span>
                );

                // translator: {names} is a comma-separated list of bold participant display names, {emoji} is the reaction emoji character (e.g. 👍)
                const tooltipContent = hasMore
                    ? c('Info').jt`${reactorNames} and others reacted with ${emoji}`
                    : c('Info').jt`${reactorNames} reacted with ${emoji}`;

                return (
                    <Tooltip
                        key={emoji}
                        title={tooltipContent}
                        originalPlacement="top"
                        tooltipClassName="meet-tooltip bg-strong color-norm"
                        tooltipStyle={{ '--meet-tooltip-bg': 'var(--background-strong)' }}
                    >
                        <button
                            type="button"
                            className={clsx(
                                'chat-message-reaction-pill flex items-center gap-1',
                                hasReacted && 'chat-message-reaction-pill--active'
                            )}
                            onClick={() => onReact(emoji)}
                            aria-pressed={hasReacted}
                        >
                            <span>{emoji}</span>
                            <span className="text-xs">{identities.length}</span>
                        </button>
                    </Tooltip>
                );
            })}
        </div>
    );
};
