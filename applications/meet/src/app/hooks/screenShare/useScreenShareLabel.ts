import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectIsLocalScreenShare,
    selectScreenSharingParticipantName,
} from '@proton/meet/store/slices/screenShareStatusSlice';

export const useScreenShareLabel = () => {
    const isLocalScreenShare = useMeetSelector(selectIsLocalScreenShare);
    const presenterName = useMeetSelector(selectScreenSharingParticipantName);

    return isLocalScreenShare
        ? c('Info').t`${presenterName} (you) is presenting`
        : c('Info').t`${presenterName} is presenting`;
};
