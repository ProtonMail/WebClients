import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Dropdown, DropdownButton, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components';
import { MemberRole, NonProtonInvitationState } from '@proton/drive-sdk';

export const MenuItem = ({
    iconName,
    label,
    isSelected,
    onClick,
}: {
    iconName?: IconName;
    label: ReactNode;
    isSelected?: boolean;
    onClick: () => void;
}) => (
    <DropdownMenuButton className="text-left flex justify-space-between items-center flex-nowrap" onClick={onClick}>
        <span className="flex items-center flex-nowrap mr-14">
            {iconName && <Icon name={iconName} className="mr-2" />}
            {label}
        </span>
        {isSelected ? <Icon name="checkmark" /> : null}
    </DropdownMenuButton>
);

export const roleOptions = [MemberRole.Viewer, MemberRole.Editor];

interface Props {
    selectedRole: MemberRole;
    onChangeRole: (role: MemberRole) => void;
    onRemoveAccess?: () => void;
    onCopyInvitationLink?: () => void;
    onResendInvitationEmail?: () => void;
    externalInvitationState?: NonProtonInvitationState;
    isLoading?: boolean;
    disabled?: boolean;
    autocompleteOptions?: boolean;
}

export const RoleDropdownMenu = ({
    disabled,
    selectedRole,
    onChangeRole,
    onRemoveAccess,
    onCopyInvitationLink,
    onResendInvitationEmail,
    externalInvitationState,
    isLoading = false,
    autocompleteOptions = false,
}: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const externalInvitationStateLabels: { [key in NonProtonInvitationState]: string } = {
        [NonProtonInvitationState.Pending]: c('Status').t`Pending`,
        [NonProtonInvitationState.UserRegistered]: c('Status').t`Accepted`,
    };

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

    const memberChangeRoleLabels: Partial<{ [key in MemberRole]: string }> = {
        [MemberRole.Viewer]: c('Label').t`Make viewer`,
        [MemberRole.Editor]: c('Label').t`Make editor`,
    };

    const getRoleOptionLabel = (role: MemberRole) => {
        if (autocompleteOptions) {
            return memberRoleLabels[role];
        } else if (role === selectedRole) {
            return externalInvitationState
                ? `${memberRoleLabels[role]} (${externalInvitationStateLabels[externalInvitationState]})`
                : memberRoleLabels[role];
        } else {
            return memberChangeRoleLabels[role];
        }
    };

    return (
        <>
            <Tooltip
                title={
                    externalInvitationState === NonProtonInvitationState.Pending
                        ? c('Tooltip').t`We have sent them an invite to access the item.`
                        : ''
                }
            >
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
                    {externalInvitationState
                        ? externalInvitationStateLabels[externalInvitationState]
                        : memberRoleLabels[selectedRole]}
                </DropdownButton>
            </Tooltip>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    {roleOptions.map((role) => {
                        const label = getRoleOptionLabel(role);
                        return (
                            <MenuItem
                                key={role}
                                isSelected={role === selectedRole}
                                iconName={memberRoleIcons[role]}
                                label={label}
                                onClick={() => onChangeRole(role)}
                            />
                        );
                    })}
                    {onResendInvitationEmail &&
                        (!externalInvitationState || externalInvitationState === NonProtonInvitationState.Pending) && (
                            <MenuItem
                                iconName="paper-plane-horizontal"
                                label={c('Action').t`Resend invite`}
                                onClick={onResendInvitationEmail}
                            />
                        )}
                    {onCopyInvitationLink && (
                        <MenuItem
                            iconName="link"
                            label={c('Action').t`Copy invite link`}
                            onClick={onCopyInvitationLink}
                        />
                    )}
                    {onRemoveAccess && (
                        <MenuItem iconName="cross-big" label={c('Action').t`Remove access`} onClick={onRemoveAccess} />
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
