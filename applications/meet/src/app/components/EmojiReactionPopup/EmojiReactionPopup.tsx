import type React from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { RAISE_HAND_EMOJI } from '../../constants';
import { EMOJI_REACTIONS, type EmojiReaction, useEmojiReaction } from '../../hooks/bridges/useEmojiReaction';
import { useRaiseHand } from '../../hooks/bridges/useRaiseHand';

import './EmojiReactionPopup.scss';

interface Props {
    onClose: () => void;
}

export const EmojiReactionPopup = ({ onClose }: Props) => {
    const sendEmojiReaction = useEmojiReaction();
    const { isHandRaised, toggleHand } = useRaiseHand();

    return (
        <div className="emoji-reaction-popup p-2 flex" role="toolbar" aria-label={c('Label').t`Emoji reactions`}>
            <div className="flex gap-2 items-center">
                {EMOJI_REACTIONS.map((emoji: EmojiReaction) => (
                    <button
                        key={emoji}
                        type="button"
                        className="emoji-reaction-button text-3xl rounded-full w-custom h-custom flex items-center justify-center interactive"
                        style={{ '--w-custom': '2.75rem', '--h-custom': '2.75rem' } as React.CSSProperties}
                        aria-label={c('Action').t`React with ${emoji}`}
                        onClick={() => {
                            void sendEmojiReaction(emoji);
                            onClose();
                        }}
                    >
                        <span aria-hidden="true">{emoji}</span>
                    </button>
                ))}
                <div className="w-px self-stretch bg-weak mx-1" />
                <button
                    type="button"
                    className={clsx(
                        'emoji-reaction-button text-3xl rounded-full w-custom h-custom flex items-center justify-center interactive',
                        isHandRaised && 'emoji-reaction-button--active'
                    )}
                    style={{ '--w-custom': '2.75rem', '--h-custom': '2.75rem' } as React.CSSProperties}
                    aria-label={isHandRaised ? c('Action').t`Lower hand` : c('Action').t`Raise hand`}
                    aria-pressed={isHandRaised}
                    onClick={() => {
                        void toggleHand();
                        onClose();
                    }}
                >
                    {RAISE_HAND_EMOJI}
                </button>
            </div>
        </div>
    );
};
