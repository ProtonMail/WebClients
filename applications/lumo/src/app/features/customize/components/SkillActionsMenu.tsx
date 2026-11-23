import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';

interface SkillActionsMenuProps {
    onOpen: () => void;
    /** Left out for skills the user can't change, e.g. Proton's. */
    onEdit?: () => void;
    onDelete?: () => void;
}

export const SkillActionsMenu = ({ onOpen, onEdit, onDelete }: SkillActionsMenuProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <button
                ref={anchorRef}
                type="button"
                className="skill-actions-menu__button bg-transparent p-0 flex shrink-0 items-center justify-center radius-8 interactive"
                aria-label={c('collider_2025:Action').t`More options`}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={toggle}
            >
                <LumoIcon name="EllipsisVertical" size={16} />
            </button>
            <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close} originalPlacement="bottom-end">
                <DropdownMenu>
                    <DropdownMenuButton className="flex flex-nowrap items-center gap-2 text-left" onClick={onOpen}>
                        <LumoIcon name="Info" size={16} />
                        {c('collider_2025:Action').t`View details`}
                    </DropdownMenuButton>
                    {onEdit && (
                        <DropdownMenuButton className="flex flex-nowrap items-center gap-2 text-left" onClick={onEdit}>
                            <LumoIcon name="Pen" size={16} />
                            {c('collider_2025:Action').t`Edit`}
                        </DropdownMenuButton>
                    )}
                    {onDelete && (
                        <DropdownMenuButton
                            className="flex flex-nowrap items-center gap-2 text-left"
                            onClick={onDelete}
                        >
                            <LumoIcon name="Trash" size={16} />
                            {c('collider_2025:Action').t`Delete`}
                        </DropdownMenuButton>
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
