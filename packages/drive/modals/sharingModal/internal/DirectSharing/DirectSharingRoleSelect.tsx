import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';

import type { DirectSharingRole } from '../interfaces';
import { DirectSharingRoles } from './helpers/DirectSharingRoles';
import { MemberRoleTranslations } from './helpers/DirectSharingTranslations';

export function DirectSharingRoleSelect({
    disabled,
    selectedRole,
    onChangeRole,
}: {
    disabled: boolean;
    selectedRole: DirectSharingRole;
    onChangeRole: (role: DirectSharingRole) => void;
}) {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                disabled={disabled}
                className="self-center"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret
                shape="ghost"
                size="small"
            >
                {MemberRoleTranslations[selectedRole]}
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    <DirectSharingRoles onChangeRole={onChangeRole} selectedRole={selectedRole} />
                </DropdownMenu>
            </Dropdown>
        </>
    );
}
