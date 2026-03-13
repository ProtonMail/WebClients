import { useLocalParticipant } from '@livekit/components-react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectChatMessageReactions } from '@proton/meet/store/slices/meetingState';
import clsx from '@proton/utils/clsx';

import './ChatMessageReactions.scss';

interface ChatMessageReactionsProps {
    messageId: string;
    onReact: (emoji: string) => void;
}

export const ChatMessageReactions = ({ messageId, onReact }: ChatMessageReactionsProps) => {
    const reactions = useMeetSelector((state) => selectChatMessageReactions(state, messageId));
    const { localParticipant } = useLocalParticipant();

    const entries = Object.entries(reactions);

    if (entries.length === 0) {
        return null;
    }

    return (
        <div className="chat-message-reactions flex flex-wrap gap-1 mt-1">
            {entries.map(([emoji, identities]) => {
                const hasReacted = identities.includes(localParticipant.identity);
                return (
                    <button
                        key={emoji}
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
                );
            })}
        </div>
    );
};
