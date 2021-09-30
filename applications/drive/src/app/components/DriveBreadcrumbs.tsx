import { useEffect, useState } from 'react';
import { c } from 'ttag';

import { CollapsingBreadcrumbs, Icon, useNotifications } from '@proton/components';
import { BreadcrumbInfo } from '@proton/components/components/collapsingBreadcrumbs/interfaces';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { DriveFolder } from '../hooks/drive/useActiveShare';
import useNavigate from '../hooks/drive/useNavigate';
import { useDriveDragMoveTarget } from '../hooks/drive/useDriveDragMove';
import useWorkingDirectory from '../hooks/drive/useWorkingDirectory';

interface Props {
    activeFolder: DriveFolder;
}

const DriveBreadcrumbs = ({ activeFolder }: Props) => {
    const { navigateToLink } = useNavigate();
    const { createNotification } = useNotifications();
    const { getHandleItemDrop } = useDriveDragMoveTarget(activeFolder.shareId);
    const path = useWorkingDirectory();
    const [dropTarget, setDropTarget] = useState<string>();
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbInfo[]>([
        {
            key: 'default',
            text: c('Title').t`My files`,
            noShrink: true,
        },
    ]);

    useEffect(() => {
        let canceled = false;

        path.traverseLinksToRoot(activeFolder.shareId, activeFolder.linkId)
            .then((workingDirectory) => {
                if (canceled) {
                    return;
                }

                const breadcrumbs = workingDirectory.map((linkMeta) => {
                    const isRoot = !linkMeta.ParentLinkID;
                    const text = path.getLinkName(linkMeta);
                    const handleDrop = getHandleItemDrop(linkMeta);

                    const breadcrumb: BreadcrumbInfo = {
                        key: linkMeta.LinkID,
                        text,
                        noShrink: isRoot,
                        highlighted: dropTarget === linkMeta.LinkID,
                        collapsedText: (
                            <>
                                <Icon name="folder" className="mt0-25 mr0-5 mr0-25 flex-item-noshrink color-warning" />
                                <span title={text} className="text-ellipsis">
                                    {text}
                                </span>
                            </>
                        ),
                        onClick: () => navigateToLink(activeFolder.shareId, linkMeta.LinkID, LinkType.FOLDER),
                        onDragLeave: () => {
                            setDropTarget(undefined);
                        },
                        onDragOver: (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (dropTarget !== linkMeta.LinkID) {
                                setDropTarget(linkMeta.LinkID);
                            }
                        },
                        onDrop: async (e) => {
                            setDropTarget(undefined);
                            try {
                                await handleDrop(e);
                            } catch (e: any) {
                                createNotification({
                                    text: c('Notification').t`Failed to move, please try again`,
                                    type: 'error',
                                });
                                console.error(e);
                            }
                        },
                    };
                    return breadcrumb;
                });
                setBreadcrumbs(breadcrumbs);
            })
            .catch(console.error);

        return () => {
            canceled = true;
        };
    }, [activeFolder.shareId, activeFolder.linkId, dropTarget]);

    return <CollapsingBreadcrumbs breadcrumbs={breadcrumbs} />;
};

export default DriveBreadcrumbs;
