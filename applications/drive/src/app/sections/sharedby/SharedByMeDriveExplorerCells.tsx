import { useShallow } from 'zustand/react/shallow';

import type { Breakpoints } from '@proton/components';
import { NodeType } from '@proton/drive';
import { useThumbnail } from '@proton/drive/modules/thumbnails';

import { GridItemContent } from '../../statelessComponents/DriveExplorer/cells/gridComponents/GridItemContent';
import { GridItemName } from '../../statelessComponents/DriveExplorer/cells/gridComponents/GridItemName';
import type { CellDefinition, GridDefinition } from '../../statelessComponents/DriveExplorer/types';
import { NameCell, defaultNameCellConfig } from '../commonDriveExplorerCells/NameCell';
import { AccessCountCell, defaultAccessCountCellConfig } from './driveExplorerCells/AccessCountCell';
import { CreatedCell, defaultCreatedCellConfig } from './driveExplorerCells/CreatedCell';
import { ExpirationCell, defaultExpirationCellConfig } from './driveExplorerCells/ExpirationCell';
import { LocationCell, defaultLocationCellConfig } from './driveExplorerCells/LocationCell';
import { useSharedByMeStore } from './useSharedByMe.store';

export const getSharedByMeCells = ({
    viewportWidth,
}: {
    viewportWidth: Breakpoints['viewportWidth'];
}): CellDefinition[] => [
    {
        ...defaultNameCellConfig,
        render: (uid) => {
            const NameCellComponent = () => {
                const { name, type, mediaType, activeRevisionUid, haveSignatureIssues } = useSharedByMeStore(
                    useShallow((state) => {
                        const item = state.getSharedByMeItem(uid);
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
                        mediaType={type === NodeType.File || type === NodeType.Photo ? mediaType : undefined}
                        thumbnailUrl={thumbnail?.sdUrl}
                        haveSignatureIssues={haveSignatureIssues}
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
                const location = useSharedByMeStore((state) => state.getSharedByMeItem(uid)?.location);
                if (location === undefined) {
                    return null;
                }
                return <LocationCell location={location} />;
            };
            return <LocationCellComponent />;
        },
    },
    {
        ...defaultCreatedCellConfig,
        disabled: !viewportWidth['>=large'],
        render: (uid) => {
            const CreatedCellComponent = () => {
                const creationTime = useSharedByMeStore((state) => state.getSharedByMeItem(uid)?.creationTime);
                if (!creationTime) {
                    return null;
                }
                return <CreatedCell time={creationTime} />;
            };
            return <CreatedCellComponent />;
        },
    },
    {
        ...defaultAccessCountCellConfig,
        disabled: !viewportWidth['>=large'],
        render: (uid) => {
            const AccessCountCellComponent = () => {
                const count = useSharedByMeStore(
                    (state) => state.getSharedByMeItem(uid)?.publicLink?.numberOfInitializedDownloads
                );
                return <AccessCountCell count={count} />;
            };
            return <AccessCountCellComponent />;
        },
    },
    {
        ...defaultExpirationCellConfig,
        render: (uid) => {
            const ExpirationCellComponent = () => {
                const expirationTime = useSharedByMeStore(
                    (state) => state.getSharedByMeItem(uid)?.publicLink?.expirationTime
                );
                const isExpired = expirationTime ? expirationTime < new Date() : false;
                return <ExpirationCell time={expirationTime} isExpired={isExpired} />;
            };
            return <ExpirationCellComponent />;
        },
    },
];

export const getSharedByMeGrid = (): GridDefinition => ({
    name: (uid) => {
        const NameComponent = () => {
            const { name, type, haveSignatureIssues } = useSharedByMeStore(
                useShallow((state) => {
                    const item = state.getSharedByMeItem(uid);
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
            const { type, name, mediaType, activeRevisionUid } = useSharedByMeStore(
                useShallow((state) => {
                    const item = state.getSharedByMeItem(uid);
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
