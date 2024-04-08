import { useRef } from 'react';

import { c } from 'ttag';

import { Avatar, Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { getInitials } from '@proton/shared/lib/helpers/string';

import { useContextMenuControls } from '../../../FileBrowser';
import { ShareInvitationContextMenu } from '../../../sharing/ShareInvitationContextMenu';

interface Props {
    invitationId: string;
    volumeId: string;
    linkId: string;
    contactEmail: string;
    contactName?: string;
}
export const DirectSharingListInvitation = ({ invitationId, volumeId, linkId, contactEmail, contactName }: Props) => {
    const ref = useRef<HTMLButtonElement>(null);
    const contextMenuControls = useContextMenuControls();

    return (
        <>
            <ShareInvitationContextMenu
                key={invitationId}
                anchorRef={ref}
                isOpen={contextMenuControls.isOpen}
                position={contextMenuControls.position}
                open={contextMenuControls.open}
                close={contextMenuControls.close}
                volumeId={volumeId}
                linkId={linkId}
                invitationId={invitationId}
            />
            <li className="flex items-center">
                <div className={'flex items-center my-4'}>
                    <Avatar color="weak" className="mr-2">
                        {getInitials(contactName || contactEmail)}
                    </Avatar>
                    <p className="flex flex-column p-0 m-0">
                        <span className="text-semibold">{contactName ? contactName : contactEmail}</span>
                        {contactName && <span className="color-weak">{contactEmail}</span>}
                    </p>
                </div>
                {/*// TODO: This component bellow is fully temporary for testing purpose*/}

                <Button
                    className="ml-auto"
                    ref={ref}
                    shape="ghost"
                    size="small"
                    icon
                    onClick={(e) => {
                        contextMenuControls.handleContextMenu(e);
                    }}
                    onTouchEnd={(e) => {
                        contextMenuControls.handleContextMenuTouch(e);
                    }}
                >
                    <Icon name="three-dots-vertical" alt={c('Action').t`More options`} />
                </Button>
            </li>
        </>
    );
};
