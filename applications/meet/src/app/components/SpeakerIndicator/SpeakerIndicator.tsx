import React from 'react';

import './SpeakerIndicator.scss';

interface SpeakerIndicatorProps {
    size: number;
}

export const SpeakerIndicator = ({ size = 6 }: SpeakerIndicatorProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`sound-wave icon-size-${size}`}
        style={{ color: 'currentColor' }}
    >
        <rect x="1" y="6" width="2" height="4" rx="1" className="bar bar1" />
        <rect x="4" y="4" width="2" height="8" rx="1" className="bar bar2" />
        <rect x="7" y="3.5" width="2" height="9" rx="1" className="bar bar3" />
        <rect x="10" y="4" width="2" height="8" rx="1" className="bar bar4" />
        <rect x="13" y="6" width="2" height="4" rx="1" className="bar bar5" />
    </svg>
);
