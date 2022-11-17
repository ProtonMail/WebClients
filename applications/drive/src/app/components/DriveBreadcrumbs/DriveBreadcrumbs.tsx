import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { CollapsingBreadcrumbs, Loader, useNotifications } from '@proton/components';
import { BreadcrumbInfo } from '@proton/components/components/collapsingBreadcrumbs/interfaces';

import { DriveFolder } from '../../hooks/drive/useActiveShare';
import { useDriveDragMoveTarget } from '../../hooks/drive/useDriveDragMove';
import useNavigate from '../../hooks/drive/useNavigate';
import { useLinkPath } from '../../store';
import { Share, ShareType, useShare } from '../../store/_shares';
import { reportError } from '../../store/_utils';
import SignatureIcon from '../SignatureIcon';
import { getDevicesSectionName } from '../sections/Devices/constants';

interface Props {
    activeFolder: DriveFolder;
}

const DriveBreadcrumbs = ({ activeFolder }: Props) => {
    const { navigateToLink, navigateToDevices } = useNavigate();
    const { createNotification } = useNotifications();
    const { getHandleItemDrop } = useDriveDragMoveTarget(activeFolder.shareId);
    const { traverseLinksToRoot } = useLinkPath(); // TODO: Get data using useFolderView instead one day.

    const [dropTarget, setDropTarget] = useState<string>();
    const [rootShare, setRootShare] = useState<Share>();
    const { getShare } = useShare();
    const sectionTitle = getDevicesSectionName();

    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbInfo[]>([]);

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
                                <SignatureIcon
                                    isFile={link.isFile}
                                    signatureIssues={link.signatureIssues}
                                    className="mr0-25"
                                />
                                <span className="text-pre text-ellipsis">{name}</span>
                            </span>
                        ),
                        noShrink: isRoot && rootShare?.type !== ShareType.device, // Keep root (My files) to be always fully visible.
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
                reportError(err);
            });

        return () => {
            abortController.abort();
        };
    }, [activeFolder.shareId, activeFolder.linkId, dropTarget, rootShare]);

    useEffect(() => {
        const abortController = new AbortController();
        void getShare(abortController.signal, activeFolder.shareId).then((share) => {
            setRootShare(share);
        });
    }, [activeFolder.shareId]);

    if (breadcrumbs.length === 0) {
        return <Loader className="pt0-5 pb0-5 pl0-75 pr0-75" />;
    }

    if (rootShare?.type === ShareType.device) {
        breadcrumbs.unshift({
            key: 'devices-root',
            text: sectionTitle,
            noShrink: true,
            onClick: navigateToDevices,
        });
    }

    return <CollapsingBreadcrumbs breadcrumbs={breadcrumbs} />;
};

export default DriveBreadcrumbs;
