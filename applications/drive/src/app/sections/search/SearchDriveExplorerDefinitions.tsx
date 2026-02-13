import { useShallow } from 'zustand/react/shallow';

import type { Breakpoints } from '@proton/components';

import { GridItemContent } from '../../statelessComponents/DriveExplorer/cells/gridComponents/GridItemContent';
import { GridItemName } from '../../statelessComponents/DriveExplorer/cells/gridComponents/GridItemName';
import type { CellDefinition, GridDefinition } from '../../statelessComponents/DriveExplorer/types';
import { useThumbnailStore } from '../../zustand/thumbnails/thumbnails.store';
import { LocationCell, defaultLocationCellConfig } from '../commonDriveExplorerCells/LocationCell';
import { ModifiedCell, defaultModifiedCellConfig } from '../commonDriveExplorerCells/ModifiedCell';
import { NameCell, defaultNameCellConfig } from '../commonDriveExplorerCells/NameCell';
import { SizeCell, defaultSizeCellConfig } from '../commonDriveExplorerCells/SizeCell';
import { useSearchViewStore } from './store';

export const getCellDefinitions = ({
    viewportWidth,
}: {
    viewportWidth: Breakpoints['viewportWidth'];
}): CellDefinition[] => [
    {
        ...defaultNameCellConfig,
        render: (uid) => {
            const NameCellComponent = () => {
                const item = useSearchViewStore(useShallow((state) => state.getSearchResultItem(uid)));
                const thumbnail = useThumbnailStore(
                    useShallow((state) => {
                        return item?.thumbnailId ? state.getThumbnail(item?.thumbnailId) : undefined;
                    })
                );
                if (!item) {
                    return null;
                }

                return (
                    <NameCell
                        uid={uid}
                        name={item.name}
                        type={item.type}
                        mediaType={item.mediaType}
                        thumbnail={thumbnail}
                        haveSignatureIssues={item.haveSignatureIssues}
                    />
                );
            };
            return <NameCellComponent />;
        },
    },
    {
        ...defaultLocationCellConfig,
        disabled: !viewportWidth['>=large'],
        render: (uid) => {
            const LocationCellComponent = () => {
                const item = useSearchViewStore(useShallow((state) => state.getSearchResultItem(uid)));
                if (!item) {
                    return null;
                }

                return <LocationCell location={item.location} />;
            };
            return <LocationCellComponent />;
        },
    },
    {
        ...defaultModifiedCellConfig,
        render: (uid) => {
            const ModifiedCellComponent = () => {
                const item = useSearchViewStore(useShallow((state) => state.getSearchResultItem(uid)));
                if (!item) {
                    return null;
                }

                return <ModifiedCell modifiedTime={item.modificationTime} />;
            };
            return <ModifiedCellComponent />;
        },
    },

    {
        ...defaultSizeCellConfig,
        disabled: !viewportWidth['>=large'],
        render: (uid) => {
            const SizeCellComponent = () => {
                const item = useSearchViewStore(useShallow((state) => state.getSearchResultItem(uid)));
                if (!item) {
                    return null;
                }

                return <SizeCell size={item.size} />;
            };
            return <SizeCellComponent />;
        },
    },
];

export const getGridDefinition = (): GridDefinition => ({
    name: (uid) => {
        const NameComponent = () => {
            const item = useSearchViewStore(useShallow((state) => state.getSearchResultItem(uid)));
            if (!item) {
                return null;
            }
            return <GridItemName name={item.name} haveSignatureIssues={item.haveSignatureIssues} type={item.type} />;
        };
        return <NameComponent />;
    },
    mainContent: (uid) => {
        const MainContentComponent = () => {
            const item = useSearchViewStore((state) => state.getSearchResultItem(uid));
            const thumbnail = useThumbnailStore((state) =>
                item?.thumbnailId ? state.getThumbnail(item?.thumbnailId) : undefined
            );

            if (!item) {
                return null;
            }

            return (
                <GridItemContent
                    type={item.type}
                    name={item.name}
                    mediaType={item.mediaType}
                    thumbnailUrl={thumbnail?.sdUrl}
                />
            );
        };

        return <MainContentComponent />;
    },
});
