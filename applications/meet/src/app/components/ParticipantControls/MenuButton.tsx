import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcBug } from '@proton/icons/icons/IcBug';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcMeetChat } from '@proton/icons/icons/IcMeetChat';
import { IcMeetParticipants } from '@proton/icons/icons/IcMeetParticipants';
import { IcMeetSettings } from '@proton/icons/icons/IcMeetSettings';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import {
    MeetingSideBars,
    toggleSideBarState as toggleSideBarStateAction,
} from '@proton/meet/store/slices/uiStateSlice';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useDebugOverlayContext } from '../../containers/MeetContainer';
import { SlideClosable } from '../SlideClosable/SlideClosable';

import './MenuButton.scss';

export const MenuButton = () => {
    const dispatch = useMeetDispatch();
    const { isEnabled: isDebugEnabled, open: openDebugOverlay } = useDebugOverlayContext();

    const [isOpen, setIsOpen] = useState(false);

    const handleClick = (sidebarToOpen: MeetingSideBars) => {
        dispatch(toggleSideBarStateAction(sidebarToOpen));
        setIsOpen(false);
    };

    const items = [
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

                            <div className="flex flex-column gap-4 items-center justify-center w-full pt-4">
                                {items.map((item) => {
                                    return (
                                        <Button
                                            className="text-left flex items-center gap-4 menu-item w-full"
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
