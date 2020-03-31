import React, { useEffect, useState } from 'react';
import { DriveResource } from './Drive/DriveResourceProvider';
import { ResourceType } from '../interfaces/link';
import { c } from 'ttag';
import Breadcrumbs, { BreadcrumbInfo } from './Breadcrumbs/Breadcrumbs';
import useDrive from '../hooks/useDrive';

interface Props {
    resource: DriveResource;
    openResource: (resource: DriveResource) => void;
}

const DriveBreadcrumbs = ({ resource, openResource }: Props) => {
    const { getLinkMeta } = useDrive();
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbInfo[]>([]);

    useEffect(() => {
        const getBreadcrumbs = async (linkId: string): Promise<BreadcrumbInfo[]> => {
            const meta = await getLinkMeta(resource.shareId, linkId);

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
    }, [resource.shareId, resource.linkId]);

    return <Breadcrumbs breadcrumbs={breadcrumbs} />;
};

export default DriveBreadcrumbs;
