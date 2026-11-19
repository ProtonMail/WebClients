import { flushSync } from 'react-dom';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';

import { useIsRecordingSupported } from '../../hooks/useMeetingRecorder/hooks/useIsRecordingSupported';

import '../CreateMeetingDropdown/CreateMeetingDropdown.scss';

interface MoreOptionsRow {
    label: string;
    onClick: () => void;
}

interface MoreOptionsDropdownProps {
    onHelpAndFeedback: () => void;
}

export const MoreOptionsDropdown = ({ onHelpAndFeedback }: MoreOptionsDropdownProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const history = useHistory();
    const isGuest = useMeetSelector(selectIsGuest);
    const isRecordingSupported = useIsRecordingSupported();

    const rows: MoreOptionsRow[] = [
        ...(!isGuest && isRecordingSupported
            ? [{ label: c('Label').t`Manage recordings`, onClick: () => history.push('/manage-recordings') }]
            : []),
        { label: c('Action').t`Help and feedback`, onClick: onHelpAndFeedback },
    ];

    // A dialog a row opens returns focus, on close, to whatever was focused when it opened. The menu's focus trap
    // pulls focus back while the menu is open, so the menu closes first and then More options takes focus.
    const activateRow = (onClick: () => void) => {
        flushSync(close);
        anchorRef.current?.focus();
        onClick();
    };

    return (
        <>
            <DropdownButton
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret={false}
                shape="ghost"
                className="button-for-icon settings-button settings-button-icon join-page-header-button"
                aria-label={c('Action').t`More options`}
            >
                <IcThreeDotsVertical size={5} color="var(--icon-color)" />
            </DropdownButton>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement="bottom-end"
                className="create-meeting-dropdown more-options-dropdown meet-radius"
                aria-label={c('Label').t`More options`}
            >
                <DropdownMenu className="flex flex-column items-start p-2 flex-nowrap meet-radius">
                    {rows.map(({ label, onClick }) => (
                        <DropdownMenuButton
                            key={label}
                            className="create-meeting-dropdown-menu text-left flex flex-nowrap items-center gap-2 border-none shrink-0"
                            liClassName="w-full"
                            onClick={() => activateRow(onClick)}
                        >
                            {label}
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
