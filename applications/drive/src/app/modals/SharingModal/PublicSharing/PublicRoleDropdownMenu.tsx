import { c } from 'ttag';

import { Dropdown, DropdownButton, DropdownMenu, usePopperAnchor } from '@proton/components/index';
import { MemberRole } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';

import { DropdownMenuItem } from '../DropdownMenuItem';

export const roleOptions = [MemberRole.Viewer, MemberRole.Editor];

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
                        iconName="eye"
                        label={c('Label').t`Viewer`}
                        description={c('Into').t`Can view only`}
                        onClick={() => withLoading(onChangeRole(MemberRole.Viewer))}
                    />
                    <DropdownMenuItem
                        isSelected={selectedRole === MemberRole.Editor}
                        iconName="pencil"
                        label={c('Label').t`Editor`}
                        description={c('Into').t`Can view and edit`}
                        onClick={() => withLoading(onChangeRole(MemberRole.Editor))}
                    />
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
