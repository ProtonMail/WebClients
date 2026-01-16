import { useStartAudio } from '@livekit/components-react';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useFlag from '@proton/unleash/useFlag';

import './AudioPlaybackPrompt.scss';

export const AudioPlaybackPrompt = () => {
    const unblockAudioButtonEnabled = useFlag('MeetUnblockAudioButton');

    const { mergedProps, canPlayAudio } = useStartAudio({ props: {} });

    if (canPlayAudio || !unblockAudioButtonEnabled) {
        return null;
    }

    const { onClick } = mergedProps;

    return (
        <div className="audio-playback-prompt flex justify-center pb-2 absolute top-0">
            <Button color="danger" className="rounded-full" onClick={onClick}>
                {c('Action').t`Tap to unblock audio playback`}
            </Button>
        </div>
    );
};
