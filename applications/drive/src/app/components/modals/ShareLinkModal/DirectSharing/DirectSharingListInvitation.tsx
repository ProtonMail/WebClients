import { useCallback } from 'react';

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
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { getInitials } from '@proton/shared/lib/helpers/string';

interface Props {
    invitationId: string;
    volumeId: string;
    linkId: string;
    contactEmail: string;
    contactName?: string;
    onInvitationRemove: (invitationId: string) => void;
}

const MenuItem = ({ label, iconName, onClick }: { label: string; iconName: IconName; onClick: () => void }) => {
    return (
        <DropdownMenuButton onClick={onClick}>
            <span className="flex items-center mr-14">
                <Icon name={iconName} className="mr-2" />
                {label}
            </span>
        </DropdownMenuButton>
    );
};

export const DirectSharingListInvitation = ({
    invitationId,
    volumeId,
    linkId,
    contactEmail,
    contactName,
    onInvitationRemove,
}: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { createNotification } = useNotifications();

    const copyShareInviteLinkUrl = useCallback(() => {
        textToClipboard(`${window.location.origin}/${volumeId}/${linkId}?invitation=${invitationId}`);
        createNotification({
            text: c('Info').t`Link copied to clipboard`,
        });
    }, [volumeId, linkId, invitationId]);

    const handleInviteRemove = useCallback(() => {
        onInvitationRemove(invitationId);
    }, []);

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
                >
                    {c('Info').t`Pending`}
                </DropdownButton>
                <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                    <DropdownMenu>
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
