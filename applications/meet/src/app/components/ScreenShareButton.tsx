import { c } from 'ttag';

import { IcMeetScreenShare } from '@proton/icons';

import { CircleButton } from '../atoms/CircleButton/CircleButton';
import { useCurrentScreenShare } from '../hooks/useCurrentScreenShare';

export const ScreenShareButton = () => {
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
            ariaLabel={c('meet_2025 Alt').t`Toggle screen share`}
            tooltipTitle={
                isSharing ? c('meet_2025 Info').t`Stop sharing your screen` : c('meet_2025 Info').t`Share screen`
            }
        />
    );
};
