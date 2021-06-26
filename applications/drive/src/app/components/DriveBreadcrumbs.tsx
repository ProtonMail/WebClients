import React, { useEffect, useState } from 'react';
import { c } from 'ttag';

import { CollapsingBreadcrumbs, Icon, useNotifications } from 'react-components';
import { BreadcrumbInfo } from 'react-components/components/collapsingBreadcrumbs/interfaces';

import { DriveFolder } from './Drive/DriveFolderProvider';
import { LinkType } from '../interfaces/link';
import useDrive from '../hooks/drive/useDrive';
import useNavigate from '../hooks/drive/useNavigate';
import { useDriveDragMoveTarget } from '../hooks/drive/useDriveDragMove';

interface Props {
    activeFolder: DriveFolder;
}

const DriveBreadcrumbs = ({ activeFolder }: Props) => {
    const { navigateToLink } = useNavigate();
    const { getLinkMeta } = useDrive();
    const { createNotification } = useNotifications();
    const { getHandleItemDrop } = useDriveDragMoveTarget(activeFolder.shareId);
    const [dropTarget, setDropTarget] = useState<string>();
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

            const handleDrop = getHandleItemDrop(meta);

            const breadcrumb: BreadcrumbInfo = {
                key: linkId,
                text,
                noShrink: isRoot,
                highlighted: dropTarget === meta.LinkID,
                collapsedText: (
                    <>
                        <Icon name="folder" className="mt0-25 mr0-5 mr0-25 flex-item-noshrink color-warning" />
                        <span title={text} className="text-ellipsis">
                            {text}
                        </span>
                    </>
                ),
                onClick: () => navigateToLink(activeFolder.shareId, linkId, LinkType.FOLDER),
                onDragLeave: () => {
                    setDropTarget(undefined);
                },
                onDragOver: (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (dropTarget !== linkId) {
                        setDropTarget(linkId);
                    }
                },
                onDrop: async (e) => {
                    setDropTarget(undefined);
                    try {
                        await handleDrop(e);
                    } catch (e) {
                        createNotification({
                            text: c('Notification').t`Failed to move, please try again`,
                            type: 'error',
                        });
                        console.error(e);
                    }
                },
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
    }, [activeFolder.shareId, activeFolder.linkId, dropTarget]);

    return <CollapsingBreadcrumbs breadcrumbs={breadcrumbs} />;
};

export default DriveBreadcrumbs;
