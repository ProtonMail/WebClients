import type { MouseEvent, TouchEvent } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Badge, type Breakpoints, useContactEmailsCache } from '@proton/components';
import type { ConfirmActionModalProps } from '@proton/components/components/confirmActionModal/ConfirmActionModal';
import { NodeType } from '@proton/drive';

import { NameCell, defaultNameCellConfig } from '../../sections/commonDriveExplorerCells/NameCell';
import { GridItemContent } from '../../statelessComponents/DriveExplorer/cells/gridComponents/GridItemContent';
import { GridItemName } from '../../statelessComponents/DriveExplorer/cells/gridComponents/GridItemName';
import type { CellDefinition, GridDefinition } from '../../statelessComponents/DriveExplorer/types';
import { useVolumesState } from '../../store/_volumes';
import { ItemType, useSharedWithMeListingStore } from '../../zustand/sections/sharedWithMeListing.store';
import { useThumbnailStore } from '../../zustand/thumbnails/thumbnails.store';
import { AcceptRejectCell } from './driveExplorerCells/AcceptRejectCell';
import { SharedByCell, defaultSharedByCellConfig } from './driveExplorerCells/SharedByCell';
import { SharedOnCell, defaultSharedOnCellConfig } from './driveExplorerCells/SharedOnCell';
import { useInvitationsActions } from './hooks/useInvitationsActions';

export const getSharedWithMeCells = ({
    viewportWidth,
    onRenderItem,
    showConfirmModal,
}: {
    viewportWidth: Breakpoints['viewportWidth'];
    onRenderItem: (uid: string) => void;
    showConfirmModal: (props: ConfirmActionModalProps) => void;
}): CellDefinition[] => [
    {
        ...defaultNameCellConfig,
        render: (uid) => {
            const NameCellComponent = () => {
                const item = useSharedWithMeListingStore(useShallow((state) => state.getSharedWithMeItem(uid)));
                const thumbnail = useThumbnailStore(
                    useShallow((state) => (item?.thumbnailId ? state.getThumbnail(item?.thumbnailId) : undefined))
                );

                if (!item) {
                    return null;
                }

                return (
                    <NameCell
                        uid={uid}
                        name={item.name}
                        type={item.type}
                        mediaType={
                            item.type === NodeType.File || item.type === NodeType.Photo ? item.mediaType : undefined
                        }
                        thumbnail={thumbnail}
                        isInvitation={item.itemType === ItemType.INVITATION}
                        haveSignatureIssues={item.itemType === ItemType.DIRECT_SHARE ? item.haveSignatureIssues : false}
                    />
                );
            };
            return <NameCellComponent />;
        },
    },
    {
        ...defaultSharedByCellConfig,
        disabled: !viewportWidth['>=large'],
        render: (uid) => {
            const SharedByCellComponent = () => {
                const { contactEmails } = useContactEmailsCache();
                const item = useSharedWithMeListingStore(useShallow((state) => state.getSharedWithMeItem(uid)));
                if (!item) {
                    return null;
                }

                let displayName = '';
                if (item.itemType === ItemType.DIRECT_SHARE) {
                    const sharedBy = item.directShare.sharedBy;
                    const contactEmail = contactEmails?.find((contact) => contact.Email === sharedBy);
                    displayName = contactEmail?.Name || sharedBy;
                } else if (item.itemType === ItemType.INVITATION) {
                    const sharedBy = item.invitation.sharedBy;
                    const contactEmail = contactEmails?.find((contact) => contact.Email === sharedBy);
                    displayName = contactEmail?.Name || sharedBy;
                }

                return <SharedByCell displayName={displayName} isPublicLink={item.itemType === ItemType.BOOKMARK} />;
            };
            return <SharedByCellComponent />;
        },
    },
    {
        ...defaultSharedOnCellConfig,
        disabled: !viewportWidth['>=large'],
        render: (uid) => {
            const RenderedSharedOnCell = () => {
                const { setVolumeShareIds } = useVolumesState();
                const { acceptInvitation, rejectInvitation } = useInvitationsActions({ setVolumeShareIds });
                const item = useSharedWithMeListingStore(useShallow((state) => state.getSharedWithMeItem(uid)));
                if (!item) {
                    return null;
                }

                if (item.itemType === ItemType.INVITATION) {
                    return (
                        <AcceptRejectCell
                            uid={uid}
                            invitationUid={item.invitation.uid}
                            onAcceptInvitation={async (uid, invitationUid) => {
                                await acceptInvitation(uid, invitationUid, item.type);
                                onRenderItem(uid);
                            }}
                            onRejectInvitation={async (uid, invitationUid) => {
                                await rejectInvitation(showConfirmModal, {
                                    uid,
                                    invitationUid,
                                    name: item.name,
                                    type: item.type,
                                });
                            }}
                        />
                    );
                }

                let sharedOn: Date | undefined;
                if (item.itemType === ItemType.BOOKMARK) {
                    sharedOn = item.bookmark.creationTime;
                } else if (item.itemType === ItemType.DIRECT_SHARE) {
                    sharedOn = item.directShare.sharedOn;
                }

                if (!sharedOn) {
                    return null;
                }
                return <SharedOnCell sharedOn={sharedOn} />;
            };
            return <RenderedSharedOnCell />;
        },
    },
];

export const getSharedWithMeGrid = ({
    selectionControls,
    contextMenuControls,
}: {
    selectionControls: {
        selectItem: (uid: string) => void;
        isSelected: (uid: string) => boolean;
    };
    contextMenuControls: {
        isOpen: boolean;
        handleContextMenu: (e: MouseEvent<Element>) => void;
        handleContextMenuTouch: (e: TouchEvent<Element>) => void;
    };
}): GridDefinition => ({
    name: (uid) => {
        const NameComponent = () => {
            const item = useSharedWithMeListingStore(useShallow((state) => state.getSharedWithMeItem(uid)));
            if (!item) {
                return null;
            }
            return (
                <GridItemName
                    name={item.name}
                    haveSignatureIssues={(item.itemType === ItemType.DIRECT_SHARE && item.haveSignatureIssues) || false}
                    type={item.type}
                />
            );
        };
        return <NameComponent />;
    },
    mainContent: (uid) => {
        const MainContentComponent = () => {
            const item = useSharedWithMeListingStore((state) => state.getSharedWithMeItem(uid));
            const thumbnail = useThumbnailStore((state) =>
                item?.thumbnailId ? state.getThumbnail(item?.thumbnailId) : undefined
            );

            if (!item) {
                return null;
            }

            const isInvitation = item.itemType === ItemType.INVITATION;

            return (
                <GridItemContent
                    type={item.type}
                    name={item.name}
                    mediaType={item.mediaType}
                    thumbnailUrl={thumbnail?.sdUrl}
                    isInvitation={isInvitation}
                    badge={isInvitation ? <Badge type="primary">{c('Badge').t`Invited`}</Badge> : undefined}
                    onClick={
                        isInvitation
                            ? (e) => {
                                  e.stopPropagation();
                                  selectionControls?.selectItem(uid);
                                  contextMenuControls.handleContextMenu(e);
                              }
                            : undefined
                    }
                    onTouchEnd={
                        isInvitation
                            ? (e) => {
                                  selectionControls?.selectItem(uid);
                                  contextMenuControls.handleContextMenuTouch?.(e);
                              }
                            : undefined
                    }
                />
            );
        };

        return <MainContentComponent />;
    },
});
