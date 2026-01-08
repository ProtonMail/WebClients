import { c } from 'ttag';

import { Dropdown, DropdownButton, DropdownMenu, usePopperAnchor } from '@proton/components/index';
import { MemberRole } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';
import type { IconName } from '@proton/icons/types';

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
        [MemberRole.Viewer]: c('Label').t`Viewer`,
        [MemberRole.Editor]: c('Label').t`Editor`,
        [MemberRole.Admin]: c('Label').t`Editor`,
        [MemberRole.Inherited]: c('Label').t`Editor`,
    };

    const memberRoleIcons: { [key in MemberRole]: IconName } = {
        [MemberRole.Viewer]: 'eye',
        [MemberRole.Editor]: 'pencil',
        [MemberRole.Admin]: 'pencil',
        [MemberRole.Inherited]: 'pencil',
    };

    const publicLinkRoleLabels: Partial<{ [key in MemberRole]: string }> = {
        [MemberRole.Viewer]: c('Label').t`Viewer`,
        [MemberRole.Editor]: c('Label').t`Editor`,
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
                    {roleOptions.map((role) => {
                        return (
                            <DropdownMenuItem
                                key={role}
                                isSelected={role === selectedRole}
                                iconName={memberRoleIcons[role]}
                                label={publicLinkRoleLabels[role]}
                                onClick={() => withLoading(onChangeRole(role))}
                            />
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
