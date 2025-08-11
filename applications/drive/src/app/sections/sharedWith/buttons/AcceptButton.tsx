import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Icon, ToolbarButton } from '@proton/components';
import { splitNodeUid } from '@proton/drive/index';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { useInvitationsActions } from '../../../hooks/drive/useInvitationsActions';
import { useInvitationsActions as useLegacyInvitationsActions } from '../../../store';
import { legacyTimestampToDate } from '../../../utils/sdk/legacyTime';
import { ItemType, useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';
import { useSharedInfoBatcher } from '../legacy/useLegacyDirectSharingInfo';

interface BaseProps {
    nodeUid: string;
    invitationUid: string;
    isAlbum: boolean;
}

interface ContextMenuProps extends BaseProps {
    type: 'contextMenu';
    close: () => void;
}

interface ToolbarProps extends BaseProps {
    type: 'toolbar';
    close?: never;
}

type Props = ContextMenuProps | ToolbarProps;
export const AcceptButton = ({ nodeUid, invitationUid, isAlbum, close, type }: Props) => {
    const { acceptInvitation: legacyAcceptInvitation } = useLegacyInvitationsActions();
    const { acceptInvitation } = useInvitationsActions();
    const { loadSharedInfo } = useSharedInfoBatcher();

    const { getSharedWithMeItemFromStore, setSharedWithMeItemToStore } = useSharedWithMeListingStore(
        useShallow((state) => ({
            getSharedWithMeItemFromStore: state.getSharedWithMeItem,
            setSharedWithMeItemToStore: state.setSharedWithMeItem,
        }))
    );

    const handleAcceptInvitation = async () => {
        if (isAlbum) {
            await legacyAcceptInvitation(new AbortController().signal, invitationUid, true, (result) => {
                const sharedWithMeItem = getSharedWithMeItemFromStore(nodeUid);
                if (sharedWithMeItem?.itemType === ItemType.INVITATION) {
                    const { nodeId, volumeId } = splitNodeUid(nodeUid);
                    loadSharedInfo(result.shareId, (sharedInfo) => {
                        if (!sharedInfo) {
                            console.warn(
                                'The shared with me node entity is missing sharing info. It could be race condition and means it is probably not shared anymore.',
                                { uid: nodeUid, shareId: result.shareId }
                            );
                            return;
                        }
                        setSharedWithMeItemToStore({
                            nodeUid,
                            name: sharedWithMeItem.name,
                            type: sharedWithMeItem.type,
                            mediaType: sharedWithMeItem.mediaType,
                            itemType: ItemType.DIRECT_SHARE,
                            thumbnailId: sharedWithMeItem.thumbnailId,
                            size: sharedWithMeItem.size,
                            directShare: {
                                sharedOn: legacyTimestampToDate(sharedInfo.sharedOn),
                                sharedBy: sharedInfo.sharedBy,
                            },
                            legacy: {
                                linkId: nodeId,
                                shareId: result.shareId,
                                volumeId: volumeId,
                            },
                        });
                    });
                }
            });
        } else {
            await acceptInvitation(nodeUid, invitationUid);
        }
    };

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={c('Action').t`Accept`}
                icon={<Icon name="checkmark" alt={c('Action').t`Accept`} />}
                onClick={handleAcceptInvitation}
                data-testid="toolbar-accept-invitation"
            />
        );
    }

    return (
        <ContextMenuButton
            icon="checkmark"
            name={c('Action').t`Accept`}
            action={handleAcceptInvitation}
            close={close}
            testId="shared-with-me-accept-invitation"
        />
    );
};
