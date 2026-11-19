import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { useIsAudioPlaybackBlocked } from './useIsAudioPlaybackBlocked';
import { useUnblockAudioPlayback } from './useUnblockAudioPlayback';

import './AudioPlaybackPrompt.scss';

export const AudioPlaybackPrompt = () => {
    const isAudioPlaybackBlocked = useIsAudioPlaybackBlocked();
    const unblockAudioPlayback = useUnblockAudioPlayback();

    if (!isAudioPlaybackBlocked) {
        return null;
    }

    return (
        <div className="audio-playback-prompt flex justify-center pb-2 absolute top-0">
            <Button color="danger" className="rounded-full" onClick={unblockAudioPlayback}>
                {c('Action').t`Tap to unblock audio playback`}
            </Button>
        </div>
    );
};
