import { useShallow } from 'zustand/react/shallow';

import type { Breakpoints } from '@proton/components';
import { MemberRole, getDrive } from '@proton/drive';
import { useThumbnail } from '@proton/drive/modules/thumbnails';

import { GridItemContent } from '../../statelessComponents/DriveExplorer/cells/gridComponents/GridItemContent';
import { GridItemName } from '../../statelessComponents/DriveExplorer/cells/gridComponents/GridItemName';
import type { CellDefinition, GridDefinition } from '../../statelessComponents/DriveExplorer/types';
import { DateCell } from '../commonDriveExplorerCells/DateCell';
import { NameCell, defaultNameCellConfig } from '../commonDriveExplorerCells/NameCell';
import { ShareOptionsCell, defaultShareOptionsCellConfig } from '../commonDriveExplorerCells/ShareOptionsCell';
import { SizeCell, defaultSizeCellConfig } from '../commonDriveExplorerCells/SizeCell';
import { defaultModifiedTimeCellConfig } from '../commonDriveExplorerCells/modifiedTimeCellConfig';
import { useFolderStore } from './useFolder.store';

const ShareOptionsCellComponent = ({ uid }: { uid: string }) => {
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

    if (!isShared || !volumeId || !linkId || trashed || role !== MemberRole.Admin) {
        return null;
    }

    return <ShareOptionsCell nodeUid={uid} drive={getDrive()} />;
};

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
        ...defaultShareOptionsCellConfig,
        disabled: !viewportWidth['>=large'],
        render: (uid) => <ShareOptionsCellComponent uid={uid} />,
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
