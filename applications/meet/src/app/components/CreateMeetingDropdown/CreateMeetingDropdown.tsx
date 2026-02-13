import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import clsx from '@proton/utils/clsx';

import './CreateMeetingDropdown.scss';

interface CreateMeetingDropdownProps {
    onScheduleClick: () => void;
    onStartMeetingClick: () => void;
    onCreateRoomClick: () => void;
    className?: string;
}

export const CreateMeetingDropdown = ({
    onScheduleClick,
    onStartMeetingClick,
    onCreateRoomClick,
    className,
}: CreateMeetingDropdownProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret={false}
                shape="ghost"
                className={clsx(
                    className,
                    'rounded-full border-none flex items-center justify-center create-meeting-dropdown-button text-rg pl-5 pr-6 py-4'
                )}
                size="large"
            >
                <span className="inline-flex items-center mx-2">
                    <IcPlus size={4} className="shrink-0 mr-2" />
                    {c('Action').t`Create meeting`}
                </span>
            </DropdownButton>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                className="create-meeting-dropdown meet-radius"
            >
                <DropdownMenu className="flex flex-column items-start py-2 px-1 flex-nowrap meet-radius">
                    <DropdownMenuButton
                        className="create-meeting-dropdown-menu text-left flex flex-nowrap items-center gap-2 border-none shrink-0"
                        liClassName="w-full"
                        onClick={() => onStartMeetingClick()}
                    >
                        {c('Action').t`Start an instant meeting`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="create-meeting-dropdown-menu text-left flex flex-nowrap items-center gap-2 border-none shrink-0"
                        liClassName="w-full"
                        onClick={() => onScheduleClick()}
                    >
                        {c('Action').t`Schedule a meeting`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="create-meeting-dropdown-menu text-left flex flex-nowrap items-center gap-2 border-none shrink-0"
                        liClassName="w-full"
                        onClick={() => onCreateRoomClick()}
                    >
                        {c('Action').t`Create a room`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
