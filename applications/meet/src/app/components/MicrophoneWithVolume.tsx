import { useLocalParticipant } from '@livekit/components-react';

import type { IconProps } from '@proton/components/components/icon/Icon';
import type { IconSize } from '@proton/icons';
import { IcMeetMicrophone } from '@proton/icons';

import { useMicrophoneVolume } from '../hooks/useMicrophoneVolume';

const NORMAL_SPEAKING_MIN_THRESHOLD = 0.04;
const NORMAL_SPEAKING_THRESHOLD = 0.1;
const VOLUME_UPDATE_THROTTLE_MS = 100;

interface MicrophoneWithVolumeProps {
    isMicrophoneEnabled: boolean;
    size: IconSize;
}

const clipPathYValues = [3.5, 4.5, 5.5, 7, 8, 10];

export const MicrophoneWithVolume = ({ isMicrophoneEnabled, size }: MicrophoneWithVolumeProps) => {
    const volume = useMicrophoneVolume(isMicrophoneEnabled, VOLUME_UPDATE_THROTTLE_MS);

    const updatedVolume = volume < NORMAL_SPEAKING_MIN_THRESHOLD ? 0 : volume;

    const volumeIndicatorTop = updatedVolume / NORMAL_SPEAKING_THRESHOLD;

    if (volumeIndicatorTop === 0) {
        return <IcMeetMicrophone size={size} />;
    }

    const clipPathY = clipPathYValues[Math.floor(Math.min(clipPathYValues.length - 1, volumeIndicatorTop))];

    return (
        <svg className={`icon-size-${size}`} viewBox="0 0 16 16">
            <g>
                <use href="#ic-meet-microphone" />
                <defs>
                    <clipPath id="mic-vol-clippath">
                        <rect x="0" y={12.25 - clipPathY} width="18.5" height={clipPathY} />
                    </clipPath>
                </defs>
                <path
                    d="M9.669497 7.565C9.669497 8.0545 9.544443 8.686956 9.417718 8.961923C9.290993 9.23689 8.563228 9.45349 8 9.45348C7.436772 9.45348 6.709007 9.23689 6.582282 8.961923C6.455557 8.686956 6.330503 8.0545 6.330503 7.565V3.265C6.330503 2.7755 6.455557 2.143044 6.582282 1.868077C6.709007 1.59311 7.436772 1.37652 8 1.37652L8.176457 1.386172C8.587074 1.419721 8.983664 1.634449 9.417718 2.060368C9.544443 2.335335 9.669497 2.967791 9.669497 3.457291V7.565Z"
                    fill="limegreen"
                    stroke="none"
                    clipPath="url(#mic-vol-clippath)"
                />
            </g>
        </svg>
    );
};

export const MicrophoneWithVolumeWithMicrophoneState = ({ size }: Pick<IconProps, 'size'>) => {
    const { isMicrophoneEnabled } = useLocalParticipant();

    return <MicrophoneWithVolume isMicrophoneEnabled={isMicrophoneEnabled} size={size as IconSize} />;
};
