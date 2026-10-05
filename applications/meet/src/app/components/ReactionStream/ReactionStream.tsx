import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectActiveReactions } from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    selectLocalParticipantIdentity,
    selectParticipantName,
} from '@proton/meet/store/slices/participants/participantsSlice';

import { RAISE_HAND_EMOJI } from '../../constants';

import './ReactionStream.scss';

// Upper bound so a burst of reactions can't flood the DOM
const MAX_VISIBLE_REACTIONS = 30;

interface StreamItem {
    id: string;
    identity: string;
    emoji: string;
    // Horizontal start position, in % of the viewport width
    left: number;
    // Sideways sway amplitude, in px
    drift: number;
    // How far the reaction rises, in vh
    rise: number;
}

// Maps a string to a number in [0, 1) (FNV-1a). Positions are derived from the reaction id
// rather than randomness, so each reaction gets its own spot and the result is reproducible.
const hashToUnit = (value: string, salt: number) => {
    let hash = 2166136261 ^ salt;
    for (let i = 0; i < value.length; i++) {
        hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
    }
    return (hash >>> 0) / 4294967296;
};

const between = (unit: number, min: number, max: number) => min + unit * (max - min);

const createStreamItem = (identity: string, emoji: string, timestamp: number): StreamItem => {
    const id = `${identity}-${timestamp}`;
    const unit = (salt: number) => hashToUnit(id, salt);

    return {
        id,
        identity,
        emoji,
        left: between(unit(1), 3, 25),
        drift: between(unit(2), 10, 24) * (unit(3) < 0.5 ? -1 : 1),
        rise: between(unit(4), 50, 65),
    };
};

const ReactionStreamItem = ({ item, onDone }: { item: StreamItem; onDone: (id: string) => void }) => {
    const localParticipantIdentity = useMeetSelector(selectLocalParticipantIdentity);
    const participantName = useMeetSelector((state) => selectParticipantName(state, item.identity));
    const label = item.identity === localParticipantIdentity ? c('Info').t`You` : participantName;

    return (
        <div
            className="reaction-stream-item"
            style={{
                '--reaction-left': `${item.left}%`,
                '--reaction-drift': `${item.drift}px`,
                '--reaction-rise': `${item.rise}vh`,
            }}
            onAnimationEnd={() => onDone(item.id)}
        >
            <span className="reaction-stream-emoji">{item.emoji}</span>
            {label && <span className="reaction-stream-name text-ellipsis">{label}</span>}
        </div>
    );
};

/**
 * Screen-wide stream of emoji reactions: each reaction rises from the bottom of the
 * screen with the sender's name. The raised hand is not part of the stream, it keeps
 * its static display on the participant tile (see ParticipantTileReaction).
 */
export const ReactionStream = () => {
    const activeReactions = useMeetSelector(selectActiveReactions);
    const [items, setItems] = useState<StreamItem[]>([]);
    // Last reaction timestamp seen per participant, so every new reaction plays once
    const seenRef = useRef<Record<string, number> | null>(null);

    useEffect(() => {
        if (!seenRef.current) {
            // Don't replay reactions that were already active when the stream mounted
            seenRef.current = Object.fromEntries(
                Object.entries(activeReactions).map(([identity, { timestamp }]) => [identity, timestamp])
            );
            return;
        }

        const seen = seenRef.current;
        const added: StreamItem[] = [];

        Object.entries(activeReactions).forEach(([identity, { emoji, timestamp }]) => {
            if (seen[identity] === timestamp) {
                return;
            }
            seen[identity] = timestamp;

            if (emoji !== RAISE_HAND_EMOJI) {
                added.push(createStreamItem(identity, emoji, timestamp));
            }
        });

        if (added.length) {
            setItems((prev) => [...prev, ...added].slice(-MAX_VISIBLE_REACTIONS));
        }
    }, [activeReactions]);

    const handleDone = useCallback((id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    if (!items.length) {
        return null;
    }

    return (
        // aria-hidden: reactions are already announced by MeetingAnnouncer; this layer is visual-only
        <div className="reaction-stream z-up" aria-hidden="true">
            {items.map((item) => (
                <ReactionStreamItem key={item.id} item={item} onDone={handleDone} />
            ))}
        </div>
    );
};
