import type { IconSize } from '@proton/icons';
import { IcMeetMicrophone } from '@proton/icons';

import { useMicrophoneVolume } from '../hooks/useMicrophoneVolume';

const normalSpeakingMinThreshold = 0.03;
const normalSpeakingThreshold = 0.2; // For normal speaking the volume is usually between 0 and 0.2
const volumeUpdateThrottleMs = 100;

interface MicrophoneWithVolumeProps {
    isMicrophoneEnabled: boolean;
    size: IconSize;
    viewBox: string;
}

const clipPathYValues = [3.5, 4.5, 5.5, 7, 8, 10];

export const MicrophoneWithVolume = ({ isMicrophoneEnabled, size, viewBox }: MicrophoneWithVolumeProps) => {
    const volume = useMicrophoneVolume(isMicrophoneEnabled, volumeUpdateThrottleMs);

    const updatedVolume = volume < normalSpeakingMinThreshold ? 0 : volume;

    const volumeIndicatorTop = updatedVolume / normalSpeakingThreshold;

    if (volumeIndicatorTop === 0) {
        return <IcMeetMicrophone size={size} viewBox={viewBox} />;
    }

    const clipPathY = clipPathYValues[Math.floor(Math.min(clipPathYValues.length - 1, volumeIndicatorTop))];

    return (
        <svg className={`icon-size-${size}`} viewBox={viewBox}>
            <g>
                <use href="#ic-meet-microphone" />
                <defs>
                    <clipPath id="mic-vol-clippath">
                        <rect x="0" y={14.25 - clipPathY} width="18.5" height={clipPathY} />
                    </clipPath>
                </defs>
                <path
                    d="M12.775 8.819V5.226C12.775 3.212 11.4591 1.581 9.25 1.581C7.04086 1.581 5.725 3.212 5.725 5.226V8.819C5.725 10.888 7.04086 12.519 9.25 12.519C11.4591 12.519 12.775 10.888 12.775 8.819Z"
                    fill="limegreen"
                    stroke="none"
                    clipPath="url(#mic-vol-clippath)"
                />
            </g>
        </svg>
    );
};
