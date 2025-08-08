import { useMemo } from 'react';

import { c } from 'ttag';

import { Dropdown, DropdownMenu, DropdownMenuButton, usePopperAnchor } from '@proton/components';
import { IcInfoCircle, IcMeetChat, IcMeetParticipants, IcMeetSettings, IcThreeDotsVertical } from '@proton/icons';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { MeetingSideBars } from '../../types';

export const MenuButton = () => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const { toggleSideBarState } = useUIStateContext();

    const items = useMemo(
        () => [
            {
                icon: IcMeetParticipants,
                label: c('meet_2025 Alt').t`Participants`,
                onClick: () => toggleSideBarState(MeetingSideBars.Participants),
            },
            {
                icon: IcMeetChat,
                label: c('meet_2025 Alt').t`Chat`,
                onClick: () => toggleSideBarState(MeetingSideBars.Chat),
            },
            {
                icon: IcMeetSettings,
                label: c('meet_2025 Alt').t`Settings`,
                onClick: () => toggleSideBarState(MeetingSideBars.Settings),
            },
            {
                icon: IcInfoCircle,
                label: c('meet_2025 Alt').t`Meeting details`,
                onClick: () => toggleSideBarState(MeetingSideBars.MeetingDetails),
            },
        ],
        [toggleSideBarState]
    );

    return (
        <div>
            <CircleButton anchorRef={anchorRef} IconComponent={IcThreeDotsVertical} onClick={toggle} />
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement="top-end"
                availablePlacements={['top-end']}
                adaptiveForTouchScreens={false}
            >
                <DropdownMenu>
                    {items.map((item) => {
                        return (
                            <DropdownMenuButton
                                className="text-left flex items-center gap-4"
                                key={item.label}
                                onClick={item.onClick}
                            >
                                <item.icon />
                                <span>{item.label}</span>
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </div>
    );
};
