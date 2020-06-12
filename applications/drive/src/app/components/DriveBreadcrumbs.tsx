import React, { useEffect, useState } from 'react';
import { DriveFolder } from './Drive/DriveFolderProvider';
import { c } from 'ttag';
import Breadcrumbs, { BreadcrumbInfo } from './Breadcrumbs/Breadcrumbs';
import useDrive from '../hooks/drive/useDrive';
import { LinkType } from '../interfaces/link';

interface Props {
    activeFolder: DriveFolder;
    openLink: (shareId: string, linkId: string, type: LinkType) => void;
}

const DriveBreadcrumbs = ({ activeFolder, openLink }: Props) => {
    const { getLinkMeta } = useDrive();
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbInfo[]>([]);

    useEffect(() => {
        const getBreadcrumbs = async (linkId: string): Promise<BreadcrumbInfo[]> => {
            const meta = await getLinkMeta(activeFolder.shareId, linkId);

            const breadcrumb: BreadcrumbInfo = {
                key: linkId,
                name: !meta.ParentLinkID ? c('Title').t`My files` : meta.Name,
                onClick: () => openLink(activeFolder.shareId, linkId, LinkType.FOLDER)
            };

            if (!meta.ParentLinkID) {
                return [breadcrumb];
            }

            const previous = await getBreadcrumbs(meta.ParentLinkID);

            return [...previous, breadcrumb];
        };

        let canceled = false;

        getBreadcrumbs(activeFolder.linkId).then((result) => {
            if (!canceled) {
                setBreadcrumbs(result);
            }
        });

        return () => {
            canceled = true;
        };
    }, [activeFolder.shareId, activeFolder.linkId]);

    return <Breadcrumbs breadcrumbs={breadcrumbs} />;
};

export default DriveBreadcrumbs;
