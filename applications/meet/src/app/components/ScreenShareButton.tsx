import React from 'react';

import { IcMeetScreenShare } from '@proton/icons';

import { CircleButton } from '../atoms/CircleButton/CircleButton';
import { useCurrentScreenShare } from '../hooks/useCurrentScreenShare';

export function ScreenShareButton() {
    const { videoTrack, stopScreenShare, startScreenShare, isLocal } = useCurrentScreenShare();
    const isSharing = !!videoTrack && isLocal;

    const handleClick = () => {
        if (isSharing) {
            stopScreenShare();
        } else {
            void startScreenShare();
        }
    };

    return (
        <CircleButton
            IconComponent={IcMeetScreenShare}
            onClick={handleClick}
            variant={isSharing ? 'active' : 'default'}
            iconViewPort="0 0 24 24"
        />
    );
}
