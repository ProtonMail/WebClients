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
            ariaLabel={c('l10n_nightly Alt').t`Toggle screen share`}
        />
    );
};
