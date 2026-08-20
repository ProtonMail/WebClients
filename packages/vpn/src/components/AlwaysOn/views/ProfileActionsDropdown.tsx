import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { IcPencil } from '@proton/icons/icons/IcPencil';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { IcTrash } from '@proton/icons/icons/IcTrash';

interface Props {
    onReconfigure: () => void;
    onRemove: () => void;
}

export const ProfileActionsDropdown = ({ onReconfigure, onRemove }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    return (
        <>
            <DropdownButton icon ref={anchorRef} isOpen={isOpen} onClick={toggle} shape="ghost" size="large">
                <IcThreeDotsVertical />
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom-end">
                <DropdownMenu>
                    <DropdownMenuButton
                        className="text-left"
                        onClick={() => {
                            close();
                            onReconfigure();
                        }}
                    >
                        <IcPencil className="mr-2" />
                        {c('Action').t`Configure new device profile`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="text-left color-danger"
                        onClick={() => {
                            close();
                            onRemove();
                        }}
                    >
                        <IcTrash className="mr-2" />
                        {c('Action').t`Delete device profile`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
