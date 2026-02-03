import { useShallow } from 'zustand/react/shallow';

import type { Breakpoints } from '@proton/components';
import { NodeType } from '@proton/drive';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import type { CellDefinition } from '../../statelessComponents/DriveExplorer/types';
import { useThumbnailStore } from '../../zustand/thumbnails/thumbnails.store';
import { NameCell, defaultNameCellConfig } from '../commonDriveExplorerCells/NameCell';
import { SizeCell, defaultSizeCellConfig } from '../commonDriveExplorerCells/SizeCell';
import { DownloadCell, defaultDownloadCellConfig } from './driveExplorerCells/DownloadCell';
import { UploadedByCell, defaultUploadedByCellConfig } from './driveExplorerCells/UploadedByCell';
import { usePublicFolderStore } from './usePublicFolder.store';

export const getPublicFolderCells = ({
    viewportWidth,
    onDownload,
}: {
    viewportWidth: Breakpoints['viewportWidth'];
    onDownload: (uid: string) => void;
}): CellDefinition[] => {
    const cells: CellDefinition[] = [
        {
            ...defaultNameCellConfig,
            render: (uid) => {
                const NameCellComponent = () => {
                    const item = usePublicFolderStore(useShallow((state) => state.getFolderItem(uid)));
                    const thumbnail = useThumbnailStore(
                        useShallow((state) => (item?.thumbnailId ? state.getThumbnail(item.thumbnailId) : undefined))
                    );

                    if (!item) {
                        return null;
                    }

                    return (
                        <NameCell
                            uid={uid}
                            name={item.name}
                            type={item.type}
                            mediaType={item.type === NodeType.File ? item.mediaType : undefined}
                            thumbnail={thumbnail}
                            haveSignatureIssues={item.haveSignatureIssues}
                        />
                    );
                };
                return <NameCellComponent />;
            },
        },
    ];

    cells.push({
        ...defaultUploadedByCellConfig,
        disabled: !viewportWidth['>=large'],
        render: (uid) => {
            const UploadedByCellComponent = () => {
                const item = usePublicFolderStore(useShallow((state) => state.getFolderItem(uid)));
                if (!item) {
                    return null;
                }

                return <UploadedByCell displayName={item.uploadedBy} />;
            };
            return <UploadedByCellComponent />;
        },
    });

    cells.push(
        {
            ...defaultSizeCellConfig,
            disabled: !viewportWidth['>=large'],
            render: (uid) => {
                const SizeCellComponent = () => {
                    const item = usePublicFolderStore(useShallow((state) => state.getFolderItem(uid)));
                    if (!item) {
                        return null;
                    }

                    return <SizeCell size={item.size} />;
                };
                return <SizeCellComponent />;
            },
        },
        {
            ...defaultDownloadCellConfig,
            disabled: !viewportWidth['>=large'],
            render: (uid) => {
                const DownloadCellComponent = () => {
                    const item = usePublicFolderStore(useShallow((state) => state.getFolderItem(uid)));
                    if (
                        !item ||
                        (item.mediaType && isProtonDocsDocument(item.mediaType)) ||
                        (item.mediaType && isProtonDocsSpreadsheet(item.mediaType))
                    ) {
                        return null;
                    }

                    return <DownloadCell uid={uid} onDownload={onDownload} />;
                };
                return <DownloadCellComponent />;
            },
        }
    );

    return cells;
};
