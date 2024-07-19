import { c } from 'ttag';

import type { IconName } from '@proton/components';
import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    Tooltip,
    usePopperAnchor,
} from '@proton/components';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { SHARE_EXTERNAL_INVITATION_STATE } from '@proton/shared/lib/drive/constants';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';

import { useDriveSharingFlags } from '../../../../store';

export const MenuItem = ({
    iconName,
    label,
    isSelected,
    onClick,
}: {
    iconName?: IconName;
    label: string;
    isSelected?: boolean;
    onClick: () => void;
}) => (
    <DropdownMenuButton className="text-left flex justify-space-between items-center" onClick={onClick}>
        <span className="flex items-center mr-14">
            {iconName && <Icon name={iconName} className="mr-2" />}
            {label}
        </span>
        {isSelected ? <Icon name="checkmark" /> : null}
    </DropdownMenuButton>
);

export const permissionsOptions = [MEMBER_PERMISSIONS.VIEWER, MEMBER_PERMISSIONS.EDITOR];

interface Props {
    selectedPermissions: SHARE_MEMBER_PERMISSIONS;
    onChangePermissions: (permissions: SHARE_MEMBER_PERMISSIONS) => void;
    onRemoveAccess?: () => void;
    onCopyShareInviteLink?: () => void;
    onResendInvitationEmail?: () => void;
    externalInvitationState?: SHARE_EXTERNAL_INVITATION_STATE;
    isLoading?: boolean;
    disabled?: boolean;
    autocompleteOptions?: boolean;
}

export const MemberDropdownMenu = ({
    disabled,
    selectedPermissions,
    onChangePermissions,
    onRemoveAccess,
    onCopyShareInviteLink,
    onResendInvitationEmail,
    externalInvitationState,
    isLoading = false,
    autocompleteOptions = false,
}: Props) => {
    const { isDirectSharingDisabled } = useDriveSharingFlags();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const externalInvitationStateLabels: { [key in SHARE_EXTERNAL_INVITATION_STATE]: string } = {
        [SHARE_EXTERNAL_INVITATION_STATE.PENDING]: c('Status').t`Pending`,
        [SHARE_EXTERNAL_INVITATION_STATE.USER_REGISTERED]: c('Status').t`Accepted`,
    };

    const memberPermissionsLabels = {
        [MEMBER_PERMISSIONS.VIEWER]: c('Label').t`Viewer`,
        [MEMBER_PERMISSIONS.EDITOR]: c('Label').t`Editor`,
    };

    const memberPermissionsIcons: { [key in number]: IconName } = {
        [MEMBER_PERMISSIONS.VIEWER]: 'eye',
        [MEMBER_PERMISSIONS.EDITOR]: 'pencil',
    };

    const memberChangePermissionsLabels = {
        [MEMBER_PERMISSIONS.VIEWER]: c('Label').t`Make viewer`,
        [MEMBER_PERMISSIONS.EDITOR]: c('Label').t`Make editor`,
    };

    const getPermissionsOptionLabel = (permissions: number) => {
        if (autocompleteOptions) {
            return memberPermissionsLabels[permissions];
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
                    disabled={isDirectSharingDisabled || disabled} // Kill switch that disable member management
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
                    {permissionsOptions.map((permissions) => {
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
