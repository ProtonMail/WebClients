import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useActiveBreakpoint } from '@proton/components';
import { IcBug } from '@proton/icons/icons/IcBug';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcMeetChat } from '@proton/icons/icons/IcMeetChat';
import { IcMeetHand } from '@proton/icons/icons/IcMeetHand';
import { IcMeetParticipants } from '@proton/icons/icons/IcMeetParticipants';
import { IcMeetScreenShare } from '@proton/icons/icons/IcMeetScreenShare';
import { IcMeetSettings } from '@proton/icons/icons/IcMeetSettings';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsLocalScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import {
    MeetingSideBars,
    toggleSideBarState as toggleSideBarStateAction,
} from '@proton/meet/store/slices/uiStateSlice';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useDebugOverlayContext } from '../../contexts/DebugOverlayContext';
import { useMeetContext } from '../../contexts/MeetContext';
import { EMOJI_REACTIONS, type EmojiReaction, useEmojiReaction } from '../../hooks/bridges/useEmojiReaction';
import { useRaiseHand } from '../../hooks/bridges/useRaiseHand';
import { SlideClosable } from '../SlideClosable/SlideClosable';

import './MenuButton.scss';

export const MenuButton = () => {
    const dispatch = useMeetDispatch();
    const { isEnabled: isDebugEnabled, open: openDebugOverlay } = useDebugOverlayContext();

    const { viewportWidth } = useActiveBreakpoint();

    const [isOpen, setIsOpen] = useState(false);

    const handleClick = (sidebarToOpen: MeetingSideBars) => {
        dispatch(toggleSideBarStateAction(sidebarToOpen));
        setIsOpen(false);
    };

    const { stopScreenShare, startScreenShare } = useMeetContext();
    const isSharing = useMeetSelector(selectIsLocalScreenShare);

    const { isHandRaised, toggleHand } = useRaiseHand();

    const sendEmojiReaction = useEmojiReaction();

    const handleClickScreenShare = () => {
        if (isSharing) {
            stopScreenShare();
        } else {
            void startScreenShare();
        }
        setIsOpen(false);
    };

    const isSmallViewport = viewportWidth.small || viewportWidth.xsmall;

    const items = [
        ...(isSmallViewport
            ? [
                  {
                      icon: IcMeetHand,
                      label: isHandRaised ? c('Alt').t`Lower hand` : c('Alt').t`Raise hand`,
                      onClick: () => {
                          void toggleHand();
                          setIsOpen(false);
                      },
                  },
              ]
            : []),
        {
            icon: IcMeetParticipants,
            label: c('Alt').t`Participants`,
            onClick: () => handleClick(MeetingSideBars.Participants),
        },
        {
            icon: IcMeetChat,
            label: c('Alt').t`Chat`,
            onClick: () => handleClick(MeetingSideBars.Chat),
        },
        {
            icon: IcMeetSettings,
            label: c('Alt').t`Settings`,
            onClick: () => handleClick(MeetingSideBars.Settings),
        },
        {
            icon: IcInfoCircle,
            label: c('Alt').t`Meeting details`,
            onClick: () => handleClick(MeetingSideBars.MeetingDetails),
        },
        ...(isSmallViewport
            ? [
                  {
                      icon: IcMeetScreenShare,
                      label: c('Alt').t`Screen share`,
                      onClick: () => handleClickScreenShare(),
                  },
              ]
            : []),
        ...(isDebugEnabled
            ? [
                  {
                      icon: IcBug,
                      label: c('Alt').t`Debug overlay`,
                      onClick: () => {
                          openDebugOverlay();
                          setIsOpen(false);
                      },
                  },
              ]
            : []),
    ];

    return (
        <>
            <div>
                <CircleButton IconComponent={IcThreeDotsVertical} onClick={() => setIsOpen(!isOpen)} />
            </div>
            {isOpen && (
                <SlideClosable onClose={() => setIsOpen(false)}>
                    <div className="menu-wrapper border-norm w-full h-full border border-norm">
                        <div className="menu-wrapper-content w-full h-full px-4 flex py-6 flex-column gap-4 items-center justify-center relative">
                            {!isMobile() && (
                                <button
                                    onClick={() => setIsOpen(false)}
                                    aria-label={c('Action').t`Close`}
                                    className="ml-auto ml-4 mr-4 cursor-pointer"
                                >
                                    <IcCross className="color-hint" size={5} alt={c('Action').t`Close`} />
                                </button>
                            )}

                            {isSmallViewport && (
                                <>
                                    <div className="flex flex-column gap-4 w-full">
                                        <div className="color-weak">Quick reactions</div>
                                        <div className="flex justify-space-between">
                                            {EMOJI_REACTIONS.map((emoji: EmojiReaction) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    className="emoji-reaction-button text-3xl w-custom h-custom flex items-center justify-center interactive border action-button-new rounded-full"
                                                    style={
                                                        {
                                                            '--w-custom': '2.75rem',
                                                            '--h-custom': '2.75rem',
                                                        } as React.CSSProperties
                                                    }
                                                    onClick={() => {
                                                        void sendEmojiReaction(emoji);
                                                    }}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <hr className="w-full m-0 border-weak" />
                                </>
                            )}

                            <div className="w-full text-left color-weak">Meeting actions</div>
                            <div className="flex flex-column gap-0 items-center justify-center w-full">
                                {items.map((item) => {
                                    return (
                                        <Button
                                            className="text-left flex items-center gap-4 menu-item w-full px-0"
                                            key={item.label}
                                            onClick={item.onClick}
                                            shape="ghost"
                                        >
                                            <item.icon size={6} />
                                            <span className="text-lg">{item.label}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </SlideClosable>
            )}
        </>
    );
};
