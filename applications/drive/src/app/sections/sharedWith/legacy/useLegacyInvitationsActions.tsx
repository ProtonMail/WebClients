import type { useConfirmActionModal } from '@proton/components';
import { splitInvitationUid, splitNodeUid } from '@proton/drive/index';

import { useInvitationsActions } from '../../../store/_actions/useInvitationsActions';
import { getActionEventManager } from '../../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../../utils/ActionEventManager/ActionEventManagerTypes';
import { legacyTimestampToDate } from '../../../utils/sdk/legacyTime';
import { ItemType, useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';
import { useSharedInfoBatcher } from '../legacy/useLegacyDirectSharingInfo';

export const useLegacyInvitationsActions = () => {
    const { loadSharedInfo } = useSharedInfoBatcher();
    const { acceptInvitation: legacyAcceptInvitation, rejectInvitation: legacyRejectInvitation } =
        useInvitationsActions();

    const handleLegacyAcceptInvitation = async (uid: string, invitationUid: string) => {
        const { invitationId } = splitInvitationUid(invitationUid);
        return new Promise<void>((resolve, reject) => {
            legacyAcceptInvitation(new AbortController().signal, invitationId, true, (result) => {
                const {
                    getSharedWithMeItem: getSharedWithMeItemFromStore,
                    setSharedWithMeItem: setSharedWithMeItemToStore,
                } = useSharedWithMeListingStore.getState();
                const sharedWithMeItem = getSharedWithMeItemFromStore(uid);
                if (sharedWithMeItem?.itemType === ItemType.INVITATION) {
                    const { nodeId, volumeId } = splitNodeUid(uid);
                    loadSharedInfo(result.shareId, (sharedInfo) => {
                        if (!sharedInfo) {
                            console.warn(
                                'The shared with me node entity is missing sharing info. It could be race condition and means it is probably not shared anymore.',
                                { uid, shareId: result.shareId }
                            );
                            resolve();
                            return;
                        }
                        setSharedWithMeItemToStore({
                            nodeUid: uid,
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
                        resolve();
                    });
                } else {
                    resolve();
                }
            }).catch(reject);
        });
    };

    const handleLegacyRejectInvitation = async (
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        {
            uid,
            invitationUid,
        }: {
            uid: string;
            invitationUid: string;
        }
    ) => {
        const { invitationId } = splitInvitationUid(invitationUid);
        await legacyRejectInvitation(new AbortController().signal, {
            showConfirmModal,
            invitationId,
            onSuccess: () => {
                void getActionEventManager().emit({
                    type: ActionEventName.REJECT_INVITATIONS,
                    uids: [uid],
                });
            },
        });
    };

    return {
        acceptLegacyInvitation: handleLegacyAcceptInvitation,
        rejectLegacyInvitation: handleLegacyRejectInvitation,
    };
};
