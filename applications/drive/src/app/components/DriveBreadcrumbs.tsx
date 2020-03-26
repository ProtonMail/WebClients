import React, { useEffect, useState } from 'react';
import useShare from '../hooks/useShare';
import { DriveResource } from './Drive/DriveResourceProvider';
import { ResourceType } from '../interfaces/link';
import { c } from 'ttag';
import { FileBrowserItem } from './FileBrowser/FileBrowser';
import Breadcrumbs, { BreadcrumbInfo } from './Breadcrumbs/Breadcrumbs';

interface Props {
    resource: DriveResource;
    openResource: (resource: DriveResource) => void;
    preloaded?: FileBrowserItem;
}

const DriveBreadcrumbs = ({ resource, preloaded, openResource }: Props) => {
    const { getFolderMeta } = useShare(resource.shareId);
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbInfo[]>([]);

    useEffect(() => {
        const getBreadcrumbs = async (linkId: string): Promise<BreadcrumbInfo[]> => {
            const meta = preloaded?.LinkID === linkId ? preloaded : (await getFolderMeta(linkId)).Link;

            const breadcrumb: BreadcrumbInfo = {
                key: linkId,
                name: !meta.ParentLinkID ? c('Title').t`My files` : meta.Name,
                onClick: () => openResource({ shareId: resource.shareId, linkId, type: ResourceType.FOLDER })
            };

            if (!meta.ParentLinkID) {
                return [breadcrumb];
            }

            const previous = await getBreadcrumbs(meta.ParentLinkID);

            return [...previous, breadcrumb];
        };

        let canceled = false;

        getBreadcrumbs(resource.linkId).then((result) => {
            if (!canceled) {
                setBreadcrumbs(result);
            }
        });

        return () => {
            canceled = true;
        };
    }, [getFolderMeta, resource.linkId]);

    return <Breadcrumbs breadcrumbs={breadcrumbs} />;
};

export default DriveBreadcrumbs;
