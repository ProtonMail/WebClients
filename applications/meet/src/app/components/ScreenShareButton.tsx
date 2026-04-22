import { c } from 'ttag';

import { IcMeetScreenShare } from '@proton/icons/icons/IcMeetScreenShare';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsLocalScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';

import { CircleButton } from '../atoms/CircleButton/CircleButton';
import { useMeetContext } from '../contexts/MeetContext';

export const ScreenShareButton = () => {
    const { stopScreenShare, startScreenShare } = useMeetContext();
    const isSharing = useMeetSelector(selectIsLocalScreenShare);

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
            ariaLabel={c('Alt').t`Toggle screen share`}
            tooltipTitle={isSharing ? c('Info').t`Stop sharing your screen` : c('Info').t`Share screen`}
        />
    );
};
