import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { CollapsingBreadcrumbs, Icon } from 'react-components';
import { BreadcrumbInfo } from 'react-components/components/collapsingBreadcrumbs/interfaces';
import { DriveFolder } from './Drive/DriveFolderProvider';
import useDrive from '../hooks/drive/useDrive';
import { LinkType } from '../interfaces/link';

interface Props {
    activeFolder: DriveFolder;
    openLink: (shareId: string, linkId: string, type: LinkType) => void;
}

const DriveBreadcrumbs = ({ activeFolder, openLink }: Props) => {
    const { getLinkMeta } = useDrive();
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbInfo[]>([
        {
            key: 'default',
            text: c('Title').t`My files`,
            noShrink: true,
        },
    ]);

    useEffect(() => {
        const getBreadcrumbs = async (linkId: string): Promise<BreadcrumbInfo[]> => {
            const meta = await getLinkMeta(activeFolder.shareId, linkId);
            const isRoot = !meta.ParentLinkID;
            const text = isRoot ? c('Title').t`My files` : meta.Name;

            const breadcrumb: BreadcrumbInfo = {
                key: linkId,
                text,
                noShrink: isRoot,
                collapsedText: (
                    <>
                        <Icon name="folder" className="mt0-25 mr0-5 mr0-25 flex-item-noshrink color-global-attention" />
                        <span title={text} className="ellipsis">
                            {text}
                        </span>
                    </>
                ),
                onClick: () => openLink(activeFolder.shareId, linkId, LinkType.FOLDER),
            };

            if (isRoot) {
                return [breadcrumb];
            }

            const previous = await getBreadcrumbs(meta.ParentLinkID);

            return [...previous, breadcrumb];
        };

        let canceled = false;

        getBreadcrumbs(activeFolder.linkId)
            .then((result) => {
                if (!canceled) {
                    setBreadcrumbs(result);
                }
            })
            .catch(console.error);

        return () => {
            canceled = true;
        };
    }, [activeFolder.shareId, activeFolder.linkId]);

    return <CollapsingBreadcrumbs breadcrumbs={breadcrumbs} />;
};

export default DriveBreadcrumbs;
