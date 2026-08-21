import { c } from 'ttag';

import { IcMeetSpeaker } from '@proton/icons/icons/IcMeetSpeaker';
import { IcMeetStop } from '@proton/icons/icons/IcMeetStop';

import { OptionButton } from '../../atoms/OptionButton/OptionButton';
import { useSpeakerTest } from '../../hooks/useSpeakerTest';

interface SpeakerTestOptionProps {
    /** `null` means the system default device */
    speakerDeviceId: string | null;
}

export const SpeakerTestOption = ({ speakerDeviceId }: SpeakerTestOptionProps) => {
    const { isPlaying, hasFailed, playTestSound, stopTestSound } = useSpeakerTest(speakerDeviceId);

    return (
        <div className="flex flex-column pt-1">
            <OptionButton
                showIcon
                Icon={isPlaying ? IcMeetStop : IcMeetSpeaker}
                label={isPlaying ? c('Action').t`Playing sound...` : c('Action').t`Test speakers`}
                onClick={() => {
                    if (isPlaying) {
                        stopTestSound();
                        return;
                    }
                    void playTestSound();
                }}
                ariaPressed={isPlaying}
            />
            {hasFailed && (
                <div role="alert" className="color-danger text-sm pl-8 pr-4 ml-0.5 pb-2">{c('Error')
                    .t`Couldn’t play the test sound on this speaker.`}</div>
            )}
        </div>
    );
};
