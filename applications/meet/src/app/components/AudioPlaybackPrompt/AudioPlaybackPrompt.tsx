import { useRoomContext } from '@livekit/components-react';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import noop from '@proton/utils/noop';

import { useIsAudioPlaybackBlocked } from './useIsAudioPlaybackBlocked';

import './AudioPlaybackPrompt.scss';

export const AudioPlaybackPrompt = () => {
    const room = useRoomContext();
    const isAudioPlaybackBlocked = useIsAudioPlaybackBlocked();

    if (!isAudioPlaybackBlocked) {
        return null;
    }

    return (
        <div className="audio-playback-prompt flex justify-center pb-2 absolute top-0">
            <Button color="danger" className="rounded-full" onClick={() => room.startAudio().catch(noop)}>
                {c('Action').t`Tap to unblock audio playback`}
            </Button>
        </div>
    );
};
