import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

import { c } from 'ttag';

import { type BreadcrumbInfo, CollapsingBreadcrumbs, Icon, Loader, useNotifications } from '@proton/components';
import noop from '@proton/utils/noop';

import type { DriveFolder } from '../../hooks/drive/useActiveShare';
import { useDriveDragMoveTarget } from '../../hooks/drive/useDriveDragMove';
import useNavigate from '../../hooks/drive/useNavigate';
import { useLinkPath } from '../../store';
import type { Share } from '../../store/_shares';
import { ShareType, useShare } from '../../store/_shares';
import { useDirectSharingInfo } from '../../store/_shares/useDirectSharingInfo';
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
    const { isSharedWithMe: getIsSharedWithMe } = useDirectSharingInfo();

    const [dropTarget, setDropTarget] = useState<string>();
    const [rootShare, setRootShare] = useState<Share>();
    const { getShare } = useShare();
    const sectionTitle = getDevicesSectionName();

    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbInfo[]>([]);
    const [isSharedWithMeFolder, setIsSharedWithMeFolder] = useState(false);

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
                            <span className="flex items-center flex-nowrap flex-1">
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

        getIsSharedWithMe(abortController.signal, activeFolder.shareId)
            .then((result) => {
                setIsSharedWithMeFolder(result);
            })
            .catch(noop);
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
            {isSharedWithMeFolder ? (
                <>
                    <NavLink
                        to="/shared-with-me"
                        className="button button-medium button-ghost-weak text-pre p-1 m-0 text-ellipsis *:pointer-events-none color-weak"
                    >
                        {c('Link').t`Shared with me`}
                    </NavLink>
                    <div className="rtl:mirror shrink-0" aria-hidden="true">
                        <Icon size={4} name="chevron-right" />
                    </div>
                </>
            ) : null}
            <CollapsingBreadcrumbs breadcrumbs={breadcrumbs} />
            {detailsModal}
        </>
    );
};

export default DriveBreadcrumbs;
