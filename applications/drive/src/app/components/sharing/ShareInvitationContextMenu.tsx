import type { ShareInvitation } from '../../store';
import { ContextMenuProps } from '../FileBrowser';
import { ItemContextMenu } from '../sections/ContextMenu/ItemContextMenu';
import CopyShareInvitationLinkButton from './ContextMenuButtons/CopyShareInvitationLinkButton';

export function ShareInvitationContextMenu({
    anchorRef,
    isOpen,
    position,
    open,
    close,
    invitation,
    volumeId,
    linkId,
}: ContextMenuProps & {
    invitation: ShareInvitation;
    volumeId: string;
    linkId: string;
}) {
    return (
        <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
            <CopyShareInvitationLinkButton
                volumeId={volumeId}
                linkId={linkId}
                invitationId={invitation.invitationId}
                close={close}
            />
        </ItemContextMenu>
    );
}
