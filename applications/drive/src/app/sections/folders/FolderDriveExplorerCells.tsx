import { useShallow } from 'zustand/react/shallow';

import type { Breakpoints } from '@proton/components';
import { MemberRole } from '@proton/drive/index';
import { useThumbnail } from '@proton/drive/modules/thumbnails';

import { ShareIcon } from '../../components/sections/FileBrowser/ShareIcon';
import { useSharingModal } from '../../modals/SharingModal/SharingModal';
import { GridItemContent } from '../../statelessComponents/DriveExplorer/cells/gridComponents/GridItemContent';
import { GridItemName } from '../../statelessComponents/DriveExplorer/cells/gridComponents/GridItemName';
import type { CellDefinition, GridDefinition } from '../../statelessComponents/DriveExplorer/types';
import { ModifiedCell, defaultModifiedCellConfig } from '../commonDriveExplorerCells/ModifiedCell';
import { NameCell, defaultNameCellConfig } from '../commonDriveExplorerCells/NameCell';
import { SizeCell, defaultSizeCellConfig } from '../commonDriveExplorerCells/SizeCell';
import { useFolderStore } from './useFolder.store';

export const getFolderCells = ({
    viewportWidth,
}: {
    viewportWidth: Breakpoints['viewportWidth'];
}): CellDefinition[] => [
    {
        ...defaultNameCellConfig,
        render: (uid) => {
            const NameCellComponent = () => {
                const { name, type, mimeType, activeRevisionUid, hasSignatureIssues } = useFolderStore(
                    useShallow((state) => {
                        const item = state.items.get(uid);
                        return {
                            name: item?.name,
                            type: item?.type,
                            mimeType: item?.mimeType,
                            activeRevisionUid: item?.activeRevisionUid,
                            hasSignatureIssues: item?.hasSignatureIssues,
                        };
                    })
                );
                const thumbnail = useThumbnail(activeRevisionUid);

                if (!name || !type) {
                    return null;
                }

                return (
                    <NameCell
                        uid={uid}
                        name={name}
                        type={type}
                        mediaType={mimeType}
                        thumbnailUrl={thumbnail?.sdUrl}
                        haveSignatureIssues={hasSignatureIssues}
                    />
                );
            };
            return <NameCellComponent />;
        },
    },
    {
        ...defaultModifiedCellConfig,
        disabled: !viewportWidth['>=large'],
        render: (uid) => {
            const ModifiedCellComponent = () => {
                const fileModifyTime = useFolderStore((state) => state.items.get(uid)?.fileModifyTime);
                if (!fileModifyTime) {
                    return null;
                }
                return <ModifiedCell modifiedTime={fileModifyTime} />;
            };
            return <ModifiedCellComponent />;
        },
    },
    {
        ...defaultSizeCellConfig,
        render: (uid) => {
            const SizeCellComponent = () => {
                const item = useFolderStore((state) => state.items.get(uid));
                return <SizeCell size={item?.isFile ? item.size : undefined} />;
            };
            return <SizeCellComponent />;
        },
    },
    {
        id: 'share-options',
        className: 'file-browser-list--icon-column file-browser-list--context-menu-column flex items-center',
        testId: 'column-share-options',
        disabled: !viewportWidth['>=large'],
        render: (uid) => {
            const ShareOptionsCellComponent = () => {
                const { isShared, trashed, volumeId, linkId, role } = useFolderStore(
                    useShallow((state) => {
                        const item = state.items.get(uid);
                        return {
                            isShared: item?.isShared,
                            trashed: item?.trashed ?? null,
                            volumeId: item?.volumeId,
                            linkId: item?.linkId,
                            role: state?.role,
                        };
                    })
                );
                const isAdmin = role === MemberRole.Admin;
                const { sharingModal, showSharingModal } = useSharingModal();

                if (!isShared || !volumeId || !linkId) {
                    return null;
                }

                return (
                    <>
                        <ShareIcon
                            trashed={trashed}
                            isAdmin={isAdmin}
                            onClick={() => showSharingModal({ nodeUid: uid })}
                        />
                        {sharingModal}
                    </>
                );
            };
            return <ShareOptionsCellComponent />;
        },
    },
];

export const getFolderGrid = (): GridDefinition => ({
    name: (uid) => {
        const NameComponent = () => {
            const { name, type, hasSignatureIssues } = useFolderStore(
                useShallow((state) => {
                    const item = state.items.get(uid);
                    return { name: item?.name, type: item?.type, hasSignatureIssues: item?.hasSignatureIssues };
                })
            );
            if (!name || !type) {
                return null;
            }
            return <GridItemName name={name} haveSignatureIssues={hasSignatureIssues || false} type={type} />;
        };
        return <NameComponent />;
    },
    mainContent: (uid) => {
        const MainContentComponent = () => {
            const { type, name, mimeType, activeRevisionUid } = useFolderStore(
                useShallow((state) => {
                    const item = state.items.get(uid);
                    return {
                        type: item?.type,
                        name: item?.name,
                        mimeType: item?.mimeType,
                        activeRevisionUid: item?.activeRevisionUid,
                    };
                })
            );
            const thumbnail = useThumbnail(activeRevisionUid);

            if (!type || !name) {
                return null;
            }

            return <GridItemContent type={type} name={name} mediaType={mimeType} thumbnailUrl={thumbnail?.sdUrl} />;
        };
        return <MainContentComponent />;
    },
});
