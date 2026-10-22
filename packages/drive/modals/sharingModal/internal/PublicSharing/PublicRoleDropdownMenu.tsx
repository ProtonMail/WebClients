import { MemberRole } from '@protontech/drive-sdk';
import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import useLoading from '@proton/hooks/useLoading';
import { IcEye } from '@proton/icons/icons/IcEye';
import { IcPencil } from '@proton/icons/icons/IcPencil';

import { DropdownMenuItem } from '../DropdownMenuItem';

interface Props {
    selectedRole: MemberRole;
    onChangeRole: (role: MemberRole) => Promise<void>;
    disabled: boolean;
}

export const PublicRoleDropdownMenu = ({ disabled, selectedRole, onChangeRole }: Props) => {
    const [isLoading, withLoading] = useLoading(false);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const memberRoleLabels: { [key in MemberRole]: string } = {
        [MemberRole.Viewer]: c('Label').t`can view`,
        [MemberRole.Editor]: c('Label').t`can edit`,
        [MemberRole.Admin]: c('Label').t`can edit`,
        [MemberRole.Inherited]: c('Label').t`can edit`,
    };

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
                loading={isLoading}
            >
                {memberRoleLabels[selectedRole]}
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    <DropdownMenuItem
                        isSelected={selectedRole === MemberRole.Viewer}
                        icon={IcEye}
                        label={c('Label').t`Viewer`}
                        description={c('Info').t`Can view only`}
                        onClick={() => withLoading(onChangeRole(MemberRole.Viewer))}
                    />
                    <DropdownMenuItem
                        isSelected={selectedRole === MemberRole.Editor}
                        icon={IcPencil}
                        label={c('Label').t`Editor`}
                        description={c('Info').t`Can view and edit`}
                        onClick={() => withLoading(onChangeRole(MemberRole.Editor))}
                    />
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
