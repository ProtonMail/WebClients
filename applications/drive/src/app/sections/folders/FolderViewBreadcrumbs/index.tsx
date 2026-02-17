import { useEffect } from 'react';

import { useDrive } from '@proton/drive/index';

import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { Breadcrumbs } from '../../../statelessComponents/Breadcrumbs/Breadcrumbs';
import { useFolderViewBreadcrumbs } from './useFolderViewBreadcrumbs';

type FolderViewBreadcrumbsProps = {
    nodeUid: string;
    createHandleItemDrop: (newParentUid: string) => (e: React.DragEvent<Element>) => Promise<void>;
};

export const FolderViewBreadcrumbs = ({ nodeUid, createHandleItemDrop }: FolderViewBreadcrumbsProps) => {
    const { drive } = useDrive();
    const { navigateToNodeUid } = useDriveNavigation();

    const { loading, data: crumbs, load } = useFolderViewBreadcrumbs(drive);

    useEffect(() => {
        void load(nodeUid);
    }, [load, nodeUid]);

    return (
        <Breadcrumbs
            loading={loading}
            crumbs={crumbs}
            createHandleItemDrop={createHandleItemDrop}
            events={{
                onBreadcrumbItemClick: async (nodeUid: string) => {
                    void navigateToNodeUid(nodeUid);
                },
            }}
        />
    );
};
