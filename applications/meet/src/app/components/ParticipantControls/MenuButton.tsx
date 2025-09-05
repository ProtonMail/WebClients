import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { IcInfoCircle, IcMeetChat, IcMeetParticipants, IcMeetSettings, IcThreeDotsVertical } from '@proton/icons';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { MeetingSideBars } from '../../types';

export const MenuButton = () => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const { toggleSideBarState } = useUIStateContext();

    const items = [
        {
            icon: IcMeetParticipants,
            label: c('Alt').t`Participants`,
            onClick: () => toggleSideBarState(MeetingSideBars.Participants),
        },
        {
            icon: IcMeetChat,
            label: c('Alt').t`Chat`,
            onClick: () => toggleSideBarState(MeetingSideBars.Chat),
        },
        {
            icon: IcMeetSettings,
            label: c('Alt').t`Settings`,
            onClick: () => toggleSideBarState(MeetingSideBars.Settings),
        },
        {
            icon: IcInfoCircle,
            label: c('Alt').t`Meeting details`,
            onClick: () => toggleSideBarState(MeetingSideBars.MeetingDetails),
        },
    ];

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
