import { c } from 'ttag';

import { IcMeetScreenShare } from '@proton/icons/icons/IcMeetScreenShare';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsSharingScreen } from '@proton/meet/store/slices/meetingInfo';

import { CircleButton } from '../atoms/CircleButton/CircleButton';
import { useMeetContext } from '../contexts/MeetContext';

export const ScreenShareButton = () => {
    const { stopScreenShare, startScreenShare } = useMeetContext();
    const isSharing = useMeetSelector(selectIsSharingScreen);

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
