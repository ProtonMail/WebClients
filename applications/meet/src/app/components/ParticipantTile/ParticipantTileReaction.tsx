import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectActiveReaction, selectRaisedHands } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { selectIsLocalParticipantAdminOrHost } from '@proton/meet/store/slices/sortedParticipantsSlice';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { RAISE_HAND_EMOJI } from '../../constants';
import { useRaiseHand } from '../../hooks/bridges/useRaiseHand';
import { ConditionalTooltip } from '../ConditionalTooltip/ConditionalTooltip';

type Props = {
    participantIdentity: string;
    position: number;
};

export const ParticipantTileReaction = ({ participantIdentity, position }: Props) => {
    const isAdminLowerHandEnabled = useFlag('MeetAdminLowerHand');

    const isLocalParticipantAdminOrHost = useMeetSelector(selectIsLocalParticipantAdminOrHost);

    const activeEmoji = useMeetSelector((state) => selectActiveReaction(state, participantIdentity));
    const raisedHands = useMeetSelector(selectRaisedHands);
    const isHandRaised = raisedHands.includes(participantIdentity);
    const displayEmoji = activeEmoji || (isHandRaised ? RAISE_HAND_EMOJI : undefined);
    const { adminLowerHand } = useRaiseHand();

    // Track the last visible emoji synchronously during render so the exit class
    // is applied in the very same render where displayEmoji becomes undefined.
    const lastEmojiRef = useRef<string | undefined>(displayEmoji);
    if (displayEmoji) {
        lastEmojiRef.current = displayEmoji;
    }
    const [, setExitTick] = useState(0);
    const isExiting = !displayEmoji && !!lastEmojiRef.current;
    const emojiToRender = displayEmoji ?? (isExiting ? lastEmojiRef.current : undefined);

    useEffect(() => {
        if (!displayEmoji && lastEmojiRef.current) {
            const timer = setTimeout(() => {
                lastEmojiRef.current = undefined;
                setExitTick((n) => n + 1);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [displayEmoji]);

    if (!emojiToRender) {
        return null;
    }

    const canAdminLowerHand = isLocalParticipantAdminOrHost && isHandRaised && isAdminLowerHandEnabled;

    const emojiWithControls = canAdminLowerHand ? (
        <ConditionalTooltip title={c('Info').t`Lower participant's hand`}>
            <button
                type="button"
                className="inline-flex items-center justify-center border-none bg-transparent p-0 m-0 font-inherit leading-none cursor-pointer"
                aria-label={c('Info').t`Lower participant's hand`}
                onClick={() => {
                    void adminLowerHand(participantIdentity);
                }}
            >
                {emojiToRender}
            </button>
        </ConditionalTooltip>
    ) : (
        emojiToRender
    );

    return (
        <div
            className={clsx(
                'absolute z-up participant-tile-emoji',
                canAdminLowerHand ? 'pointer-events-auto' : 'pointer-events-none',
                isExiting && 'participant-tile-emoji--exit'
            )}
            style={{
                top: `${position}rem`,
                left: `${position}rem`,
            }}
        >
            {emojiWithControls}
        </div>
    );
};
