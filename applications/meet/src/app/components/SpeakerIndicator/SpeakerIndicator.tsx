import React from 'react';

import type { Participant } from '@proton-meet/livekit-client';

import './SpeakerIndicator.scss';

type SpeakerIndicatorProps = {
    size?: number;
    participant: Participant;
};

const BAR_CONFIG = [
    { x: 1, minH: 1, maxH: 3 },
    { x: 4, minH: 2, maxH: 7 },
    { x: 7, minH: 2.5, maxH: 8 },
    { x: 10, minH: 2, maxH: 7 },
    { x: 13, minH: 1, maxH: 3 },
];

export const SpeakerIndicator = ({ size = 16, participant }: SpeakerIndicatorProps) => {
    const centerY = 8;

    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="sound-wave color-inherit">
            {BAR_CONFIG.map((bar, i) => {
                const scaledAudioLevel = Math.pow(participant.audioLevel, 0.7);
                const height = bar.minH + (bar.maxH - bar.minH) * scaledAudioLevel;
                const y = centerY - height / 2;

                return (
                    <rect
                        key={i}
                        x={bar.x}
                        y={y}
                        width={2}
                        height={height}
                        rx={1}
                        className="bar"
                        style={{
                            transition: 'height 50ms ease-out, y 50ms ease-out',
                        }}
                    />
                );
            })}
        </svg>
    );
};
