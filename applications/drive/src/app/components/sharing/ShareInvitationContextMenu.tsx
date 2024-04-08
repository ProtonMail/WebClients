import { ContextMenuProps } from '../FileBrowser';
import { ItemContextMenu } from '../sections/ContextMenu/ItemContextMenu';
import CopyShareInvitationLinkButton from './ContextMenuButtons/CopyShareInvitationLinkButton';

export function ShareInvitationContextMenu({
    anchorRef,
    isOpen,
    position,
    open,
    close,
    invitationId,
    volumeId,
    linkId,
}: ContextMenuProps & {
    invitationId: string;
    volumeId: string;
    linkId: string;
}) {
    return (
        <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
            <CopyShareInvitationLinkButton
                volumeId={volumeId}
                linkId={linkId}
                invitationId={invitationId}
                close={close}
            />
        </ItemContextMenu>
    );
}
