import type { IconSize } from '@proton/components';
import { IcMeetSpeakerIndicator } from '@proton/icons';

interface SpeakingIndicatorProps {
    size: number;
    iconSize?: IconSize;
}

export const SpeakingIndicator = ({ size, iconSize = 5 }: SpeakingIndicatorProps) => {
    return (
        <div
            className="color-success bg-weak border-weak border-radius-full size-12 flex items-center justify-center rounded-full"
            style={{ width: size, height: size }}
        >
            <IcMeetSpeakerIndicator size={iconSize} viewBox="0 0 14 10" />
        </div>
    );
};
