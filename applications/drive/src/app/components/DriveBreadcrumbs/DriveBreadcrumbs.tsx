import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { CollapsingBreadcrumbs, Loader, useNotifications } from '@proton/components';
import { BreadcrumbInfo } from '@proton/components/components/collapsingBreadcrumbs/interfaces';

import { DriveFolder } from '../../hooks/drive/useActiveShare';
import { useDriveDragMoveTarget } from '../../hooks/drive/useDriveDragMove';
import useNavigate from '../../hooks/drive/useNavigate';
import { useLinkPath } from '../../store';
import { Share, ShareType, useShare } from '../../store/_shares';
import { sendErrorReport } from '../../utils/errorHandling';
import SignatureIcon from '../SignatureIcon';
import { useDetailsModal } from '../modals/DetailsModal';
import { getDevicesSectionName } from '../sections/Devices/constants';

interface Props {
    activeFolder: DriveFolder;
}

const DriveBreadcrumbs = ({ activeFolder }: Props) => {
    const { navigateToLink, navigateToDevices } = useNavigate();
    const { createNotification } = useNotifications();
    const { getHandleItemDrop } = useDriveDragMoveTarget(activeFolder.shareId);
    const { traverseLinksToRoot } = useLinkPath(); // TODO: Get data using useFolderView instead one day.
    const [detailsModal, showDetailsModal] = useDetailsModal();

    const [dropTarget, setDropTarget] = useState<string>();
    const [rootShare, setRootShare] = useState<Share>();
    const { getShare } = useShare();
    const sectionTitle = getDevicesSectionName();

    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbInfo[]>([]);

    useEffect(() => {
        const abortController = new AbortController();

        traverseLinksToRoot(abortController.signal, activeFolder.shareId, activeFolder.linkId)
            .then((pathItems) => {
                const breadcrumbs = pathItems.map(({ linkId, name, isRoot, link, isReadOnly }) => {
                    const handleDrop = getHandleItemDrop(linkId);

                    let onClick;
                    if (linkId === activeFolder.linkId) {
                        onClick = link.signatureIssues
                            ? () => showDetailsModal({ shareId: activeFolder.shareId, linkId })
                            : undefined;
                    } else {
                        onClick = () => navigateToLink(activeFolder.shareId, linkId, false);
                    }

                    const breadcrumb: BreadcrumbInfo = {
                        key: linkId,
                        text: name,
                        richText: (
                            <span className="flex items-center flex-nowrap flex-item-fluid">
                                <SignatureIcon
                                    isFile={link.isFile}
                                    signatureIssues={link.signatureIssues}
                                    className="mr-1"
                                />
                                <span className="text-pre text-ellipsis">{name}</span>
                            </span>
                        ),
                        noShrink: isRoot && rootShare?.type !== ShareType.device, // Keep root (My files) to be always fully visible.
                        highlighted: dropTarget === linkId,
                        collapsedText: name,
                        onClick,
                        onDragLeave: () => {
                            if (isReadOnly) {
                                return;
                            }
                            setDropTarget(undefined);
                        },
                        onDragOver: (e) => {
                            if (isReadOnly) {
                                return;
                            }
                            e.stopPropagation();
                            e.preventDefault();
                            if (dropTarget !== linkId) {
                                setDropTarget(linkId);
                            }
                        },
                        onDrop: async (e) => {
                            if (isReadOnly) {
                                return;
                            }
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
                sendErrorReport(err);
            });

        return () => {
            abortController.abort();
        };
    }, [activeFolder.shareId, activeFolder.linkId, dropTarget, rootShare]);

    useEffect(() => {
        const abortController = new AbortController();
        getShare(abortController.signal, activeFolder.shareId)
            .then((share) => {
                setRootShare(share);
            })
            .catch(sendErrorReport);
        return () => {
            abortController.abort();
        };
    }, [activeFolder.shareId]);

    if (breadcrumbs.length === 0) {
        return <Loader className="py-2 px-3" />;
    }

    if (rootShare?.type === ShareType.device) {
        breadcrumbs.unshift({
            key: 'devices-root',
            text: sectionTitle,
            noShrink: true,
            onClick: navigateToDevices,
        });
    }

    return (
        <>
            <CollapsingBreadcrumbs breadcrumbs={breadcrumbs} />
            {detailsModal}
        </>
    );
};

export default DriveBreadcrumbs;
