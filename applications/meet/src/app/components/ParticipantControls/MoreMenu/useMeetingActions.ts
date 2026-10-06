import { supportsScreenSharing } from '@livekit/components-core';
import { c } from 'ttag';

import { IcMeetChat } from '@proton/icons/icons/IcMeetChat';
import { IcMeetHand } from '@proton/icons/icons/IcMeetHand';
import { IcMeetParticipants } from '@proton/icons/icons/IcMeetParticipants';
import { IcMeetScreenShare } from '@proton/icons/icons/IcMeetScreenShare';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsLocalScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import { MeetingSideBars, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';

import { useMeetContext } from '../../../contexts/MeetContext';
import { useRaiseHand } from '../../../hooks/bridges/useRaiseHand';
import type { MoreMenuAction } from './MoreMenuItems';

export const useMeetingActions = () => {
    const dispatch = useMeetDispatch();
    const { stopScreenShare, startScreenShare } = useMeetContext();
    const isSharing = useMeetSelector(selectIsLocalScreenShare);
    const { isHandRaised, toggleHand } = useRaiseHand();

    const participants: MoreMenuAction = {
        id: 'participants',
        Icon: IcMeetParticipants,
        label: c('Action').t`Participants`,
        onClick: () => dispatch(toggleSideBarState(MeetingSideBars.Participants)),
    };

    const chat: MoreMenuAction = {
        id: 'chat',
        Icon: IcMeetChat,
        label: c('Action').t`Chat`,
        onClick: () => dispatch(toggleSideBarState(MeetingSideBars.Chat)),
    };

    const raiseHand: MoreMenuAction = {
        id: 'raise-hand',
        Icon: IcMeetHand,
        label: isHandRaised ? c('Action').t`Lower hand` : c('Action').t`Raise hand`,
        onClick: () => {
            void toggleHand();
        },
    };

    const screenShare: MoreMenuAction | undefined = supportsScreenSharing()
        ? {
              id: 'screen-share',
              Icon: IcMeetScreenShare,
              label: isSharing ? c('Action').t`Stop sharing` : c('Action').t`Share screen`,
              onClick: () => {
                  if (isSharing) {
                      stopScreenShare();
                  } else {
                      void startScreenShare();
                  }
              },
          }
        : undefined;

    return { participants, chat, raiseHand, screenShare };
};
