import { useShallow } from 'zustand/react/shallow';

import type { Breakpoints } from '@proton/components';
import { MemberRole, getDrive } from '@proton/drive';
import { useSharingModal } from '@proton/drive/modules/sharingModal';
import { useThumbnail } from '@proton/drive/modules/thumbnails';

import { ShareIcon } from '../../components/sections/FileBrowser/ShareIcon';
import { GridItemContent } from '../../statelessComponents/DriveExplorer/cells/gridComponents/GridItemContent';
import { GridItemName } from '../../statelessComponents/DriveExplorer/cells/gridComponents/GridItemName';
import type { CellDefinition, GridDefinition } from '../../statelessComponents/DriveExplorer/types';
import { DateCell } from '../commonDriveExplorerCells/DateCell';
import { NameCell, defaultNameCellConfig } from '../commonDriveExplorerCells/NameCell';
import { SizeCell, defaultSizeCellConfig } from '../commonDriveExplorerCells/SizeCell';
import { defaultModifiedTimeCellConfig } from '../commonDriveExplorerCells/modifiedTimeCellConfig';
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
        ...defaultModifiedTimeCellConfig,
        disabled: !viewportWidth['>=large'],
        render: (uid) => {
            const ModifiedCellComponent = () => {
                const fileModifyTime = useFolderStore((state) => state.items.get(uid)?.fileModifyTime);
                if (!fileModifyTime) {
                    return null;
                }
                return <DateCell date={fileModifyTime} />;
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
                            // For folder section so we can force getDrive
                            onClick={() => showSharingModal({ nodeUid: uid, drive: getDrive() })}
                        />
                        {/* The modal is rendered inside an interactive Drive Explorer row.
                        This is broken accessibility: actionable elements should not be nested
                        inside other actionable elements. Because the modal lives inside the
                        interactive row, events triggered in the sharing modal propagate to the
                        parent row handler (via React Portal event propagation). */}
                        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                        <div
                            style={{ display: 'contents' }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                            onContextMenu={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                        >
                            {sharingModal}
                        </div>
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
