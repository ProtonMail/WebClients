import type { MouseEvent, TouchEvent } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Badge, type Breakpoints, FileIcon, useContactEmailsCache } from '@proton/components';
import type { ConfirmActionModalProps } from '@proton/components/components/confirmActionModal/ConfirmActionModal';
import { NodeType } from '@proton/drive';
import { isCompatibleCBZ } from '@proton/shared/lib/helpers/mimetype';
import clsx from '@proton/utils/clsx';

import { FileName } from '../../components/FileName';
import { SignatureIcon } from '../../components/SignatureIcon';
import { getLinkIconText } from '../../components/sections/FileBrowser/utils';
import { NameCell, defaultNameCellConfig } from '../../sections/commonDriveExplorerCells/NameCell';
import { ContextMenuCell } from '../../statelessComponents/DriveExplorer/cells/ContextMenuCell';
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
    selectionControls: {
        selectItem: (uid: string) => void;
        isSelected: (uid: string) => boolean;
    };
    contextMenuControls: {
        isOpen: boolean;
        handleContextMenu: (e: MouseEvent<Element>) => void;
    };
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

                return (
                    <SharedByCell
                        uid={uid}
                        displayName={displayName}
                        isPublicLink={item.itemType === ItemType.BOOKMARK}
                    />
                );
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

export const getSharedWithMeContextMenu = ({
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
    };
}) => {
    const ContextMenuRenderer = (uid: string) => {
        const isContextMenuButtonActive = contextMenuControls.isOpen && selectionControls.isSelected(uid);
        return (
            <ContextMenuCell
                isActive={isContextMenuButtonActive}
                onClick={(e) => {
                    selectionControls.selectItem(uid);
                    contextMenuControls.handleContextMenu(e);
                }}
            />
        );
    };
    return ContextMenuRenderer;
};

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
                <div className="flex items-center mx-auto">
                    <SignatureIcon
                        haveSignatureIssues={
                            (item.itemType === ItemType.DIRECT_SHARE && item.haveSignatureIssues) || false
                        }
                        isFile={item.type === NodeType.File || item.type === NodeType.Photo}
                        className="mr-2 shrink-0"
                    />

                    <FileName text={item.name} testId="grid-item-name" />
                </div>
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

            const iconText = getLinkIconText({
                linkName: item.name,
                mimeType: item.mediaType || '',
                isFile: item.type === NodeType.File || item.type === NodeType.Photo,
            });

            const IconComponent = (
                <>
                    {item.type === NodeType.Album && (
                        <FileIcon
                            mimeType="Album"
                            alt={c('Label').t`Album`}
                            size={12}
                            style={isInvitation ? { filter: 'grayscale(100%)' } : undefined}
                        />
                    )}
                    {thumbnail?.sdUrl && item.type !== NodeType.Album && (
                        <img
                            src={thumbnail?.sdUrl}
                            className={clsx(
                                'w-full h-full',
                                // TODO: DRVWEB-4404
                                // In the future: Music Cover, M4B Audiobook Cover, and other types that are not images that also have covers in their metadata
                                item.mediaType && isCompatibleCBZ(item.mediaType, item.name)
                                    ? 'object-contain'
                                    : 'object-cover'
                            )}
                            style={{ objectPosition: 'center' }}
                            alt={iconText}
                        />
                    )}
                    {!thumbnail?.sdUrl && item.type !== NodeType.Album && (
                        <FileIcon
                            mimeType={
                                ((item.type === NodeType.File || item.type === NodeType.Photo) && item.mediaType) ||
                                'Folder'
                            }
                            alt={iconText}
                            size={12}
                            style={isInvitation ? { filter: 'grayscale(100%)' } : undefined}
                        />
                    )}
                </>
            );

            return (
                <>
                    {isInvitation && (
                        <Badge className="absolute top-0 right-0 mt-1 mr-1" type="primary">
                            {c('Badge').t`Invited`}
                        </Badge>
                    )}
                    {isInvitation ? (
                        <button
                            className="w-full h-full cusor-pointer flex items-center justify-center"
                            onClick={(e) => {
                                e.stopPropagation();
                                selectionControls?.selectItem(uid);
                                contextMenuControls.handleContextMenu(e);
                            }}
                            onTouchEnd={(e) => {
                                selectionControls?.selectItem(uid);
                                contextMenuControls.handleContextMenuTouch?.(e);
                            }}
                        >
                            {IconComponent}
                        </button>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">{IconComponent}</div>
                    )}
                </>
            );
        };

        return <MainContentComponent />;
    },
});
