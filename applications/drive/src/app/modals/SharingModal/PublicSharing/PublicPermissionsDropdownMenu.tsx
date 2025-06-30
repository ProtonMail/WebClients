// This is copy of PermissionDropdownMenu, this should be removed and updated once public sharing is supported by sdk
import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Dropdown, DropdownButton, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components';
import { SHARE_EXTERNAL_INVITATION_STATE } from '@proton/shared/lib/drive/constants';
import { SHARE_MEMBER_PERMISSIONS, SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions';

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

export const permissionsOptions = [SHARE_MEMBER_PERMISSIONS.VIEWER, SHARE_MEMBER_PERMISSIONS.EDITOR];
export const shareUrlPermissionsOptions = [SHARE_URL_PERMISSIONS.VIEWER, SHARE_URL_PERMISSIONS.EDITOR];

interface Props {
    selectedPermissions: number;
    onChangePermissions: (permissions: number) => void;
    onRemoveAccess?: () => void;
    onCopyShareInviteLink?: () => void;
    onResendInvitationEmail?: () => void;
    externalInvitationState?: SHARE_EXTERNAL_INVITATION_STATE;
    isLoading?: boolean;
    disabled?: boolean;
    autocompleteOptions?: boolean;
    publicSharingOptions?: boolean;
}

export const PublicPermissionsDropdownMenu = ({
    disabled,
    selectedPermissions,
    onChangePermissions,
    onRemoveAccess,
    onCopyShareInviteLink,
    onResendInvitationEmail,
    externalInvitationState,
    isLoading = false,
    autocompleteOptions = false,
    publicSharingOptions = false,
}: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const externalInvitationStateLabels: { [key in SHARE_EXTERNAL_INVITATION_STATE]: string } = {
        [SHARE_EXTERNAL_INVITATION_STATE.PENDING]: c('Status').t`Pending`,
        [SHARE_EXTERNAL_INVITATION_STATE.USER_REGISTERED]: c('Status').t`Accepted`,
    };

    const memberPermissionsLabels = {
        [SHARE_MEMBER_PERMISSIONS.VIEWER]: c('Label').t`Viewer`,
        [SHARE_MEMBER_PERMISSIONS.EDITOR]: c('Label').t`Editor`,
    };

    const memberPermissionsIcons: { [key in number]: IconName } = {
        [SHARE_MEMBER_PERMISSIONS.VIEWER]: 'eye',
        [SHARE_MEMBER_PERMISSIONS.EDITOR]: 'pencil',
    };

    const memberChangePermissionsLabels = {
        [SHARE_MEMBER_PERMISSIONS.VIEWER]: c('Label').t`Make viewer`,
        [SHARE_MEMBER_PERMISSIONS.EDITOR]: c('Label').t`Make editor`,
    };

    const publicSharingPermissionsLabels = {
        [SHARE_URL_PERMISSIONS.VIEWER]: c('Label').t`Viewer`,
        [SHARE_URL_PERMISSIONS.EDITOR]: c('Label').t`Editor`,
    };

    const getPermissionsOptionLabel = (permissions: number) => {
        if (autocompleteOptions) {
            return memberPermissionsLabels[permissions];
        } else if (publicSharingOptions) {
            return publicSharingPermissionsLabels[permissions];
        } else if (permissions === selectedPermissions) {
            return externalInvitationState
                ? `${memberPermissionsLabels[permissions]} (${externalInvitationStateLabels[externalInvitationState]})`
                : memberPermissionsLabels[permissions];
        } else {
            return memberChangePermissionsLabels[permissions];
        }
    };

    return (
        <>
            <Tooltip
                title={
                    externalInvitationState === SHARE_EXTERNAL_INVITATION_STATE.PENDING
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
                        : memberPermissionsLabels[selectedPermissions]}
                </DropdownButton>
            </Tooltip>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    {(publicSharingOptions ? shareUrlPermissionsOptions : permissionsOptions).map((permissions) => {
                        const label = getPermissionsOptionLabel(permissions);
                        return (
                            <MenuItem
                                key={permissions}
                                isSelected={permissions === selectedPermissions}
                                iconName={memberPermissionsIcons[permissions]}
                                label={label}
                                onClick={() => onChangePermissions(permissions)}
                            />
                        );
                    })}
                    {onResendInvitationEmail &&
                        (!externalInvitationState ||
                            externalInvitationState === SHARE_EXTERNAL_INVITATION_STATE.PENDING) && (
                            <MenuItem
                                iconName="paper-plane-horizontal"
                                label={c('Action').t`Resend invite`}
                                onClick={onResendInvitationEmail}
                            />
                        )}
                    {onCopyShareInviteLink && (
                        <MenuItem
                            iconName="link"
                            label={c('Action').t`Copy invite link`}
                            onClick={onCopyShareInviteLink}
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
