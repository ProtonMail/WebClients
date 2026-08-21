import { c } from 'ttag';

import { IcMeetMicrophone } from '@proton/icons/icons/IcMeetMicrophone';
import { IcMeetStop } from '@proton/icons/icons/IcMeetStop';

import { OptionButton } from '../../atoms/OptionButton/OptionButton';
import { VolumeMeter } from '../../atoms/VolumeMeter/VolumeMeter';
import { MicrophoneTestFailure, MicrophoneTestStatus, useMicrophoneTest } from '../../hooks/useMicrophoneTest';

interface MicrophoneTestOptionProps {
    /** `null` means the system default device */
    microphoneDeviceId: string | null;
    /** `null` means the system default device */
    speakerDeviceId: string | null;
    noiseCancellationEnabled: boolean;
}

export const MicrophoneTestOption = ({
    microphoneDeviceId,
    speakerDeviceId,
    noiseCancellationEnabled,
}: MicrophoneTestOptionProps) => {
    const { status, level, failure, toggleTest, elapsedMs } = useMicrophoneTest({
        microphoneDeviceId,
        speakerDeviceId,
        noiseCancellationEnabled,
    });

    const getLabel = () => {
        if (status === MicrophoneTestStatus.Preparing) {
            return c('Action').t`Getting ready...`;
        }
        if (status === MicrophoneTestStatus.Recording) {
            return c('Action').t`Recording your microphone...`;
        }
        if (status === MicrophoneTestStatus.Playing) {
            return c('Action').t`Playing back...`;
        }
        return c('Action').t`Test microphone`;
    };

    const getElapsedLabel = () => {
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;

        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const getFailureMessage = () => {
        switch (failure) {
            case MicrophoneTestFailure.Permission:
                return c('Error').t`Microphone access is blocked. Allow it in your browser settings.`;
            case MicrophoneTestFailure.NotFound:
                return c('Error').t`The selected microphone is no longer available.`;
            case MicrophoneTestFailure.Busy:
                return c('Error').t`Your microphone is busy. Close other apps or tabs using it, then try again.`;
            case MicrophoneTestFailure.Playback:
                return c('Error').t`Couldn’t play the recording on this speaker.`;
            default:
                return c('Error').t`Couldn’t start the microphone test.`;
        }
    };

    return (
        <div className="flex flex-column pt-1">
            <OptionButton
                showIcon
                Icon={status === MicrophoneTestStatus.Idle ? IcMeetMicrophone : IcMeetStop}
                label={getLabel()}
                onClick={toggleTest}
                ariaPressed={status !== MicrophoneTestStatus.Idle}
                rightContent={
                    status === MicrophoneTestStatus.Recording && (
                        // Hidden from the accessible name, which would otherwise be re-announced every second
                        <span aria-hidden className="ml-auto pl-2 shrink-0 color-weak text-sm text-tabular-nums">
                            {getElapsedLabel()}
                        </span>
                    )
                }
            />
            <div className="pt-1">
                {status === MicrophoneTestStatus.Recording && (
                    // Mirrors the option button's icon slot and width, so the icon sits in the same
                    // column as the option icons and the meter starts where their labels do.
                    <div
                        className="flex items-center flex-nowrap w-full max-w-custom pr-2 pb-2 option-button option-button-no-hover"
                        style={{ '--max-w-custom': '25rem' }}
                    >
                        <div
                            className="flex items-center justify-center w-custom min-w-custom mr-2"
                            style={{ '--w-custom': '2rem', '--min-w-custom': '2rem' }}
                        >
                            <IcMeetMicrophone size={5} className="color-weak" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <VolumeMeter level={level} ariaLabel={c('Aria').t`Microphone input level`} />
                        </div>
                    </div>
                )}
                {failure && (
                    <div role="alert" className="pl-8 pr-4 ml-0.5 pb-2 color-danger text-sm">
                        {getFailureMessage()}
                    </div>
                )}
            </div>
        </div>
    );
};
