import { c } from 'ttag';

import { Avatar } from '@proton/atoms';
import { Dropdown, DropdownButton, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { getInitials } from '@proton/shared/lib/helpers/string';

interface Props {
    invitationId: string;
    volumeId: string;
    linkId: string;
    contactEmail: string;
    contactName?: string;
}
export const DirectSharingListInvitation = ({ invitationId, volumeId, linkId, contactEmail, contactName }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { createNotification } = useNotifications();

    const copyShareInviteLinkUrl = () => {
        textToClipboard(`${window.location.origin}/${volumeId}/${linkId}?invitation=${invitationId}`);
        createNotification({
            text: c('Info').t`Link copied to clipboard`,
        });
    };

    return (
        <>
            <div className="flex my-4 justify-space-between items-center">
                <div className={'flex items-center'}>
                    <Avatar color="weak" className="mr-2">
                        {getInitials(contactName || contactEmail)}
                    </Avatar>
                    <p className="flex flex-column p-0 m-0">
                        <span className="text-semibold">{contactName ? contactName : contactEmail}</span>
                        {contactName && <span className="color-weak">{contactEmail}</span>}
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
                            <DropdownMenuButton onClick={copyShareInviteLinkUrl}>
                                <span className="flex items-center mr-14">
                                    <Icon name="link" className="mr-2" />
                                    {c('Action').t`Copy invite link`}
                                </span>
                            </DropdownMenuButton>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>
        </>
    );
};
