import { useEffect, useState } from 'react';
import { c } from 'ttag';

import { CollapsingBreadcrumbs, useNotifications } from '@proton/components';
import { BreadcrumbInfo } from '@proton/components/components/collapsingBreadcrumbs/interfaces';

import { DriveFolder } from '../hooks/drive/useActiveShare';
import useNavigate from '../hooks/drive/useNavigate';
import { useDriveDragMoveTarget } from '../hooks/drive/useDriveDragMove';
import { useLinkPath } from '../store';
import SignatureIcon from './SignatureIcon';
import { mapDecryptedLinksToChildren } from './sections/helpers';

interface Props {
    activeFolder: DriveFolder;
}

const DriveBreadcrumbs = ({ activeFolder }: Props) => {
    const { navigateToLink } = useNavigate();
    const { createNotification } = useNotifications();
    const { getHandleItemDrop } = useDriveDragMoveTarget(activeFolder.shareId);
    const { traverseLinksToRoot } = useLinkPath(); // TODO: Get data using useFolderView instead one day.
    const [dropTarget, setDropTarget] = useState<string>();
    const defaultBreadcrumbs: BreadcrumbInfo[] = [
        {
            key: 'default',
            title: c('Title').t`My files`,
            text: c('Title').t`My files`,
            noShrink: true,
        },
    ];
    const [breadcrumbs, setBreadcrumbs] = useState(defaultBreadcrumbs);

    useEffect(() => {
        const abortController = new AbortController();

        traverseLinksToRoot(abortController.signal, activeFolder.shareId, activeFolder.linkId)
            .then((pathItems) => {
                const breadcrumbs = pathItems.map(({ linkId, name, isRoot, link }) => {
                    const handleDrop = getHandleItemDrop(linkId);

                    const breadcrumb: BreadcrumbInfo = {
                        key: linkId,
                        text: name,
                        richText: (
                            <span className="flex flex-align-items-center flex-nowrap flex-item-fluid">
                                <SignatureIcon item={mapDecryptedLinksToChildren([link])[0]} className="mr0-25" />
                                <span className="text-pre text-ellipsis">{name}</span>
                            </span>
                        ),
                        noShrink: !isRoot, // Keep root (My files) to be always fully visible.
                        highlighted: dropTarget === linkId,
                        collapsedText: name,
                        onClick:
                            linkId === activeFolder.linkId
                                ? undefined
                                : () => navigateToLink(activeFolder.shareId, linkId, false),
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
            .catch((err: any) => {
                if (err.name !== 'AbortError') {
                    setBreadcrumbs(defaultBreadcrumbs);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [traverseLinksToRoot, activeFolder.shareId, activeFolder.linkId, dropTarget]);

    return <CollapsingBreadcrumbs breadcrumbs={breadcrumbs} />;
};

export default DriveBreadcrumbs;
