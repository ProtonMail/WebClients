import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { useAvailableEmojiReactions, useEmojiReaction } from '../../../hooks/bridges/useEmojiReaction';

interface Props {
    buttonSize?: string;
    className?: string;
}

export const MoreMenuEmojiReactions = ({ buttonSize = '2.75rem', className }: Props) => {
    const sendEmojiReaction = useEmojiReaction();
    const emojiReactions = useAvailableEmojiReactions();

    return (
        <div className={clsx('w-full flex flex-nowrap justify-space-between gap-1', className)}>
            {emojiReactions.map((emoji) => (
                <button
                    key={emoji}
                    type="button"
                    className="emoji-reaction-button text-3xl w-custom h-custom flex items-center justify-center interactive border action-button-new rounded-full"
                    style={{ '--w-custom': buttonSize, '--h-custom': buttonSize }}
                    onClick={() => {
                        void sendEmojiReaction(emoji);
                    }}
                    aria-label={c('Action').t`React with ${emoji}`}
                >
                    <span aria-hidden="true">{emoji}</span>
                </button>
            ))}
        </div>
    );
};
