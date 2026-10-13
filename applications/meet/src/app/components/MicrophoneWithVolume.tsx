import type { IconComponentProps } from '@proton/icons/component';
import { IcMeetMicrophone } from '@proton/icons/icons/IcMeetMicrophone';
import type { IconSize } from '@proton/icons/types';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectInitialAudioState } from '@proton/meet/store/slices/deviceManagementSlice/selectors';

import { useMediaManagementContext } from '../contexts/MediaManagementProvider/MediaManagementContext';
import { useMicrophoneVolume, useMicrophoneVolumeDirect } from '../hooks/useMicrophoneVolume';

const NORMAL_SPEAKING_MIN_THRESHOLD = 0.04;
const NORMAL_SPEAKING_THRESHOLD = 0.1;
const VOLUME_UPDATE_THROTTLE_MS = 100;

interface MicrophoneWithVolumeProps {
    size: IconSize;
    volume: number;
}

const clipPathYValues = [3.5, 4.5, 5.5, 7, 8, 10];

const MicrophoneWithVolume = ({ size, volume }: MicrophoneWithVolumeProps) => {
    const updatedVolume = volume < NORMAL_SPEAKING_MIN_THRESHOLD ? 0 : volume;

    const volumeIndicatorTop = updatedVolume / NORMAL_SPEAKING_THRESHOLD;

    if (volumeIndicatorTop === 0) {
        return <IcMeetMicrophone size={size} />;
    }

    const clipPathY = clipPathYValues[Math.floor(Math.min(clipPathYValues.length - 1, volumeIndicatorTop))];

    return (
        <svg className={`icon-size-${size}`} viewBox="0 0 16 16" aria-hidden="true">
            <g>
                {/* Inlined from `IcMeetMicrophone`: the fill below shares this viewBox, so the outline can't be the component. */}
                <path d="M9.33301 2.66699C9.33301 2.31337 9.19243 1.97466 8.94238 1.72461C8.72359 1.50582 8.43706 1.37015 8.13184 1.33984L8 1.33398C7.64638 1.33398 7.30767 1.47456 7.05762 1.72461C6.80757 1.97466 6.66699 2.31337 6.66699 2.66699V8C6.66699 8.35362 6.80757 8.69331 7.05762 8.94336C7.30763 9.1932 7.64653 9.33398 8 9.33398C8.35347 9.33398 8.69237 9.1932 8.94238 8.94336C9.19243 8.69331 9.33301 8.35362 9.33301 8V2.66699ZM10.667 8C10.667 8.70717 10.3857 9.38566 9.88574 9.88574C9.38564 10.3858 8.70724 10.667 8 10.667C7.29276 10.667 6.61436 10.3858 6.11426 9.88574C5.61426 9.38566 5.33301 8.70717 5.33301 8V2.66699C5.33301 1.95975 5.61416 1.28135 6.11426 0.78125C6.61435 0.281153 7.29276 1.57833e-08 8 0L8.26367 0.0136719C8.87408 0.074311 9.44819 0.343697 9.88574 0.78125C10.3858 1.28135 10.667 1.95975 10.667 2.66699V8Z" />
                <path d="M2.66626 8V6.66699C2.66626 6.2988 2.96506 6 3.33325 6C3.70144 6 4.00024 6.2988 4.00024 6.66699V8L4.00513 8.19824C4.05408 9.18705 4.46778 10.1257 5.17114 10.8291C5.92129 11.5792 6.93938 12 8.00024 12L8.19849 11.9951C9.18697 11.946 10.1252 11.5322 10.8284 10.8291C11.5317 10.1257 11.9464 9.18706 11.9954 8.19824L12.0002 8V6.66699C12.0002 6.29891 12.2982 6.00018 12.6663 6C13.0344 6 13.3333 6.2988 13.3333 6.66699V8L13.3264 8.26465C13.261 9.5829 12.7085 10.8338 11.7708 11.7715C10.833 12.7092 9.58221 13.2619 8.26392 13.3271L8.00024 13.334C6.58576 13.334 5.22895 12.7717 4.22876 11.7715C3.29104 10.8338 2.73846 9.5829 2.6731 8.26465L2.66626 8Z" />
                <path d="M7.33301 15.334V12.667C7.33301 12.2988 7.63181 12 8 12C8.36819 12 8.66699 12.2988 8.66699 12.667V15.334C8.66682 15.702 8.36808 16 8 16C7.63192 16 7.33318 15.702 7.33301 15.334Z" />
                <path d="M10.6663 14.666L10.801 14.6797C11.1048 14.7419 11.3333 15.0109 11.3333 15.333C11.3333 15.6552 11.1048 15.9241 10.801 15.9863L10.6663 16H5.33325C4.96506 16 4.66626 15.7012 4.66626 15.333C4.66626 14.9648 4.96506 14.666 5.33325 14.666H10.6663Z" />
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

export const MicrophoneWithVolumeWithMicrophoneState = ({ size }: Pick<IconComponentProps, 'size'>) => {
    const { isAudioEnabled } = useMediaManagementContext();
    const volume = useMicrophoneVolume(isAudioEnabled, VOLUME_UPDATE_THROTTLE_MS);

    return <MicrophoneWithVolume size={size as IconSize} volume={volume} />;
};

export const MicrophoneWithVolumeWithMicrophoneStateDirect = ({ size }: Pick<IconComponentProps, 'size'>) => {
    const initialAudioState = useMeetSelector(selectInitialAudioState);
    const volume = useMicrophoneVolumeDirect(initialAudioState, VOLUME_UPDATE_THROTTLE_MS);

    return <MicrophoneWithVolume size={size as IconSize} volume={volume} />;
};
