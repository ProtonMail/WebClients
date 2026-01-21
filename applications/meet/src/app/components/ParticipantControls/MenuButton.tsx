import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcBug } from '@proton/icons/icons/IcBug';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcMeetChat } from '@proton/icons/icons/IcMeetChat';
import { IcMeetParticipants } from '@proton/icons/icons/IcMeetParticipants';
import { IcMeetSettings } from '@proton/icons/icons/IcMeetSettings';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useDebugOverlayContext } from '../../containers/MeetContainer';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { MeetingSideBars } from '../../types';

import './MenuButton.scss';

const CLOSE_THRESHOLD = 80;
const MAX_DRAG = 300;

export const MenuButton = () => {
    const { toggleSideBarState } = useUIStateContext();
    const { isEnabled: isDebugEnabled, open: openDebugOverlay } = useDebugOverlayContext();

    const [isOpen, setIsOpen] = useState(false);
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const touchStartY = useRef<number>(0);

    const handleClick = (sidebarToOpen: MeetingSideBars) => {
        toggleSideBarState(sidebarToOpen);
        setIsOpen(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) {
            return;
        }

        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartY.current;

        if (diff > 0) {
            setDragY(Math.min(diff, MAX_DRAG));
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);

        if (dragY > CLOSE_THRESHOLD) {
            setIsClosing(true);
            setTimeout(() => {
                setIsOpen(false);
                setIsClosing(false);
                setDragY(0);
            }, 300);
        } else {
            setDragY(0);
        }
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
                <div
                    className="fixed bottom-0 left-0 w-full p-2 bg-transparent z-up"
                    style={{
                        transform: `translateY(${isClosing ? '100%' : `${dragY}px`})`,
                        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                        opacity: isClosing ? 0 : Math.max(0.3, 1 - dragY / MAX_DRAG),
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="menu-wrapper border-norm w-full h-full border border-norm">
                        <div className="menu-wrapper-content w-full h-full px-4 flex py-6 flex-column gap-4 items-center justify-center relative">
                            <div className="flex justify-center pt-3 pb-1 absolute w-full top-0 left-0">
                                <div
                                    className="rounded-full w-custom h-custom menu-handle"
                                    style={{
                                        '--w-custom': '2.5rem',
                                        '--h-custom': '0.25rem',
                                    }}
                                />
                            </div>
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
                </div>
            )}
        </>
    );
};
