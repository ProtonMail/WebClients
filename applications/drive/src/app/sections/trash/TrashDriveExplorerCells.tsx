import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import type { Breakpoints } from '@proton/components';
import { useThumbnail } from '@proton/drive/modules/thumbnails';

import { SortField } from '../../modules/sorting/types';
import { GridItemContent } from '../../statelessComponents/DriveExplorer/cells/gridComponents/GridItemContent';
import { GridItemName } from '../../statelessComponents/DriveExplorer/cells/gridComponents/GridItemName';
import type { CellDefinition, GridDefinition } from '../../statelessComponents/DriveExplorer/types';
import { LocationCell, defaultLocationCellConfig } from '../commonDriveExplorerCells/LocationCell';
import { ModifiedCell, defaultModifiedCellConfig } from '../commonDriveExplorerCells/ModifiedCell';
import { NameCell, defaultNameCellConfig } from '../commonDriveExplorerCells/NameCell';
import { SizeCell, defaultSizeCellConfig } from '../commonDriveExplorerCells/SizeCell';
import { useTrashStore } from './useTrash.store';

export const getTrashCells = ({ viewportWidth }: { viewportWidth: Breakpoints['viewportWidth'] }): CellDefinition[] => [
    {
        ...defaultNameCellConfig,
        render: (uid) => {
            const NameCellComponent = () => {
                const { name, type, mediaType, activeRevisionUid, haveSignatureIssues } = useTrashStore(
                    useShallow((state) => {
                        const item = state.getItem(uid);
                        return {
                            name: item?.name,
                            type: item?.type,
                            mediaType: item?.mediaType,
                            activeRevisionUid: item?.activeRevisionUid,
                            haveSignatureIssues: item?.haveSignatureIssues,
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
                        mediaType={mediaType}
                        thumbnailUrl={thumbnail?.sdUrl}
                        haveSignatureIssues={haveSignatureIssues}
                    />
                );
            };
            return <NameCellComponent />;
        },
    },
    {
        ...{ ...defaultLocationCellConfig, className: 'w-1/5' },
        disabled: !viewportWidth['>=large'],
        render: (uid) => {
            const LocationCellComponent = () => {
                const item = useTrashStore.getState().getItem(uid);

                if (!item?.location) {
                    return null;
                }
                return <LocationCell location={item.location ?? ''} />;
            };
            return <LocationCellComponent />;
        },
    },
    {
        ...{
            ...defaultModifiedCellConfig,
            id: 'deleted',
            headerText: c('Label').t`Deleted`,
            className: 'w-1/6',
            sortField: SortField.trashedTime,
        },
        disabled: !viewportWidth['>=large'],
        render: (uid) => {
            const TrashedDateCellComponent = () => {
                const trashTime = useTrashStore((state) => state.getItem(uid)?.trashTime);
                if (!trashTime) {
                    return null;
                }
                return <ModifiedCell modifiedTime={trashTime} />;
            };
            return <TrashedDateCellComponent />;
        },
    },
    {
        ...defaultSizeCellConfig,
        render: (uid) => {
            const SizeCellComponent = () => {
                const size = useTrashStore((state) => state.getItem(uid)?.size);
                return <SizeCell size={size} />;
            };
            return <SizeCellComponent />;
        },
    },
];

export const getTrashGrid = (): GridDefinition => ({
    name: (uid) => {
        const NameComponent = () => {
            const { name, type, haveSignatureIssues } = useTrashStore(
                useShallow((state) => {
                    const item = state.getItem(uid);
                    return { name: item?.name, type: item?.type, haveSignatureIssues: item?.haveSignatureIssues };
                })
            );
            if (!name || !type) {
                return null;
            }
            return <GridItemName name={name} haveSignatureIssues={haveSignatureIssues || false} type={type} />;
        };
        return <NameComponent />;
    },
    mainContent: (uid) => {
        const MainContentComponent = () => {
            const { type, name, mediaType, activeRevisionUid } = useTrashStore(
                useShallow((state) => {
                    const item = state.getItem(uid);
                    return {
                        type: item?.type,
                        name: item?.name,
                        mediaType: item?.mediaType,
                        activeRevisionUid: item?.activeRevisionUid,
                    };
                })
            );
            const thumbnail = useThumbnail(activeRevisionUid);

            if (!type || !name) {
                return null;
            }

            return <GridItemContent type={type} name={name} mediaType={mediaType} thumbnailUrl={thumbnail?.sdUrl} />;
        };
        return <MainContentComponent />;
    },
});
