import type React from 'react';

import { c } from 'ttag';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectEmojiReactionPopupOpen, setEmojiReactionPopupOpen } from '@proton/meet/store/slices/uiStateSlice';
import clsx from '@proton/utils/clsx';

import { RAISE_HAND_EMOJI } from '../../constants';
import { EMOJI_REACTIONS, type EmojiReaction, useEmojiReaction } from '../../hooks/bridges/useEmojiReaction';
import { useRaiseHand } from '../../hooks/bridges/useRaiseHand';

import './EmojiReactionPopup.scss';

export const EmojiReactionPopup = () => {
    const dispatch = useMeetDispatch();
    const emojiReactionPopupOpen = useMeetSelector(selectEmojiReactionPopupOpen);
    const sendEmojiReaction = useEmojiReaction();
    const { isHandRaised, toggleHand } = useRaiseHand();

    if (!emojiReactionPopupOpen) {
        return null;
    }

    return (
        <div className="emoji-reaction-popup-container">
            <div className="emoji-reaction-popup large-meet-radius rounded-lg p-2 flex border border-weak">
                <div className="flex gap-2 items-center">
                    {EMOJI_REACTIONS.map((emoji: EmojiReaction) => (
                        <button
                            key={emoji}
                            type="button"
                            className="emoji-reaction-button text-3xl rounded-full w-custom h-custom flex items-center justify-center interactive"
                            style={{ '--w-custom': '2.75rem', '--h-custom': '2.75rem' } as React.CSSProperties}
                            onClick={() => {
                                void sendEmojiReaction(emoji);
                                dispatch(setEmojiReactionPopupOpen(false));
                            }}
                        >
                            {emoji}
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
                            dispatch(setEmojiReactionPopupOpen(false));
                        }}
                    >
                        {RAISE_HAND_EMOJI}
                    </button>
                </div>
                <div className="popup-caret"></div>
            </div>
        </div>
    );
};
