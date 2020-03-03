import React, { useEffect, useState } from 'react';
import useShare from '../../hooks/useShare';
import { DriveResource } from '../Drive/DriveResourceProvider';
import { ResourceType } from '../../interfaces/folder';
import { c } from 'ttag';
import { FileBrowserItem } from '../FileBrowser/FileBrowser';
import Breadcrumb from './Breadcrumb';

type BreadcrumbInfo = { name: string; resource: DriveResource };

interface Props {
    resource: DriveResource;
    openResource: (resource: DriveResource) => void;
    preloaded?: FileBrowserItem;
}

const Breadcrumbs = ({ resource, preloaded, openResource }: Props) => {
    const { getFolderMeta } = useShare(resource.shareId);
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbInfo[]>([]);

    const getBreadcrumbs = async (linkId: string): Promise<BreadcrumbInfo[]> => {
        const meta = preloaded?.LinkID === linkId ? preloaded : (await getFolderMeta(linkId)).Folder;

        const breadcrumb = {
            name: !meta.ParentLinkID ? c('Title').t`My files` : meta.Name,
            resource: { shareId: resource.shareId, linkId, type: ResourceType.FOLDER }
        };

        if (!meta.ParentLinkID) {
            return [breadcrumb];
        }

        const previous = await getBreadcrumbs(meta.ParentLinkID);

        return [...previous, breadcrumb];
    };

    useEffect(() => {
        getBreadcrumbs(resource.linkId).then((result) => setBreadcrumbs(result));
    }, [getFolderMeta, resource.linkId]);

    return (
        <div className="pd-breadcrumbs">
            {breadcrumbs.map(({ name, resource }, i) => (
                <Breadcrumb
                    key={`${resource.shareId}_${resource.linkId}`}
                    onClick={() => openResource(resource)}
                    current={i === breadcrumbs.length - 1}
                >
                    {name}
                </Breadcrumb>
            ))}
        </div>
    );
};

export default Breadcrumbs;
