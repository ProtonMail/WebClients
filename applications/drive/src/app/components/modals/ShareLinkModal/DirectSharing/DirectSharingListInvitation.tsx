import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { Avatar } from '@proton/atoms';
import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    IconName,
    usePopperAnchor,
} from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { getInitials } from '@proton/shared/lib/helpers/string';

interface Props {
    invitationId: string;
    volumeId: string;
    linkId: string;
    contactEmail: string;
    contactName?: string;
    selectedPermissions: SHARE_MEMBER_PERMISSIONS;
    onInvitationRemove: (invitationId: string) => void;
    onInvitationPermissionsChange: (invitationId: string, permissions: SHARE_MEMBER_PERMISSIONS) => Promise<void>;
}

interface PermissionOption {
    icon: IconName;
    label: string;
    value: number;
}

const MenuItem = ({
    label,
    iconName,
    isSelected,
    onClick,
}: {
    label: string;
    iconName: IconName;
    isSelected?: boolean;
    onClick: () => void;
}) => {
    return (
        <DropdownMenuButton onClick={onClick} className="text-left flex justify-space-between items-center">
            <span className="flex items-center mr-14">
                <Icon name={iconName} className="mr-2" />
                {label}
            </span>
            {isSelected ? <Icon name="checkmark" /> : null}
        </DropdownMenuButton>
    );
};

export const DirectSharingListInvitation = ({
    invitationId,
    volumeId,
    linkId,
    contactEmail,
    contactName,
    selectedPermissions,
    onInvitationRemove,
    onInvitationPermissionsChange,
}: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [isLoading, setIsLoading] = useState(false);
    const { createNotification } = useNotifications();

    const permissionsOptions: PermissionOption[] = [
        {
            icon: 'eye',
            label: c('Label').t`Viewer`,
            value: MEMBER_PERMISSIONS.VIEWER,
        },
        {
            icon: 'pencil',
            label: c('Label').t`Editor`,
            value: MEMBER_PERMISSIONS.EDITOR,
        },
    ];

    const dropdownLabel = permissionsOptions.find((permission) => permission.value === selectedPermissions)?.label;

    const copyShareInviteLinkUrl = useCallback(() => {
        textToClipboard(`${window.location.origin}/${volumeId}/${linkId}?invitation=${invitationId}`);
        createNotification({
            text: c('Info').t`Link copied to clipboard`,
        });
    }, [volumeId, linkId, invitationId]);

    const handleInviteRemove = useCallback(() => {
        onInvitationRemove(invitationId);
    }, []);

    const handleInvitationPermissionsChange = (invitationId: string, permissions: SHARE_MEMBER_PERMISSIONS) => {
        setIsLoading(true);
        onInvitationPermissionsChange(invitationId, permissions).finally(() => {
            setIsLoading(false);
        });
    };

    return (
        <div className="flex my-4 justify-space-between items-center">
            <div className={'flex items-center'}>
                <Avatar color="weak" className="mr-2">
                    {getInitials(contactName || contactEmail)}
                </Avatar>
                <p className="flex flex-column p-0 m-0">
                    <span className="text-semibold">{contactName ? contactName : contactEmail}</span>
                    {contactName ? <span className="color-weak">{contactEmail}</span> : null}
                </p>
            </div>

            <div>
                <DropdownButton
                    className="self-center"
                    ref={anchorRef}
                    isOpen={isOpen}
                    onClick={toggle}
                    hasCaret
                    shape="ghost"
                    size="small"
                    loading={isLoading}
                >
                    {dropdownLabel}
                </DropdownButton>
                <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                    <DropdownMenu>
                        <MenuItem
                            iconName={permissionsOptions[0].icon}
                            label={permissionsOptions[0].label}
                            isSelected={permissionsOptions[0].value === selectedPermissions}
                            onClick={() => handleInvitationPermissionsChange(invitationId, permissionsOptions[0].value)}
                        />
                        <MenuItem
                            iconName={permissionsOptions[1].icon}
                            label={permissionsOptions[1].label}
                            isSelected={permissionsOptions[1].value === selectedPermissions}
                            onClick={() => handleInvitationPermissionsChange(invitationId, permissionsOptions[1].value)}
                        />
                        <MenuItem
                            iconName="link"
                            label={c('Action').t`Copy invite link`}
                            onClick={copyShareInviteLinkUrl}
                        />
                        <MenuItem
                            iconName="cross-big"
                            label={c('Action').t`Remove access`}
                            onClick={handleInviteRemove}
                        />
                    </DropdownMenu>
                </Dropdown>
            </div>
        </div>
    );
};
