import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import {
    Alert,
    FileNameDisplay,
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Row,
    Tooltip,
    useModalTwoStatic,
} from '@proton/components';
import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import { useLoading } from '@proton/hooks';
import { getNumAccessesTooltipMessage, getSizeTooltipMessage } from '@proton/shared/lib/drive/translations';
import humanSize, { bytesSize } from '@proton/shared/lib/helpers/humanSize';

import { type DriveFileRevision, type SignatureIssues, useLinkPath } from '../../store';
import { useLinkDetailsView } from '../../store';
import { usePublicSession } from '../../store/_api';
import { useDownload } from '../../store/_downloads';
import { type DecryptedLink, useLinksListing, usePublicLinksListing } from '../../store/_links';
import type { ParsedExtendedAttributes } from '../../store/_links/extendedAttributes';
import useRevisions from '../../store/_revisions/useRevisions';
import { useLinkPathPublic } from '../../store/_views/useLinkPath';
import { formatAccessCount } from '../../utils/formatters';
import { Cells } from '../FileBrowser';
import SignatureAlert from '../SignatureAlert';
import ModalContentLoader from './ModalContentLoader';

const { UserNameCell, LocationCell, TimeCell, DescriptiveTypeCell, MimeTypeCell } = Cells;

interface BaseDetailsModalProps {
    shareId: string;
    linkId: string;
    checkFirstBlockSignature: ReturnType<typeof useDownload>['checkFirstBlockSignature'];
    getPath: ReturnType<typeof useLinkPath>['getPath'] | ReturnType<typeof useLinkPathPublic>['getPath'];
    anonymousView?: boolean;
    onClose?: () => void;
}

interface DetailsModalProps {
    shareId: string;
    linkId: string;
    onClose?: () => void;
}

interface PublicDetailsModalProps {
    token: string;
    linkId: string;
    onClose?: () => void;
}

interface RowProps {
    label: React.ReactNode;
    title?: string;
    children: ReactNode;
    dataTestId?: string;
}

interface RevisionDetailsModalProps {
    shareId: string;
    linkId: string;
    revision: DriveFileRevision;
    name: string;
}

interface DetailsModalContentProps {
    shareId: string;
    isFile: boolean;
    name: string;
    size: number;
    parentLinkId?: string;
    mimeType?: string;

    isSignatureIssuesLoading: boolean;
    signatureIssues?: SignatureIssues;
    signatureIssuesEmail?: string;
    signatureNetworkError?: boolean;

    lastEditedEmail?: string;
    ownerEmail?: string;

    isNumberOfAccessesLoading?: boolean;
    numberOfAccesses?: number;

    photoContentHash?: string;
    originalSize?: number;
    sha1Digest?: string;
    createTime?: number;
    fileModifyTime?: number;
    corruptedLink?: boolean;

    isAnonymous?: boolean;
    isSharedWithMeLink?: boolean;
    isExpired?: boolean;
    isShared?: boolean;

    // Revision xattr are loaded separatly so we have a loader for that
    isXattrsLoading?: boolean;

    // Only use on private app details modal
    getPath?: ReturnType<typeof useLinkPath>['getPath'];

    // Temporary disable useUser inside UserNameCell + signature check
    anonymousView?: boolean;
}

const getOriginalSize = ({ originalSize, isXattrsLoading }: { originalSize?: number; isXattrsLoading?: boolean }) => {
    if (originalSize) {
        return humanSize({ bytes: originalSize });
    }
    if (isXattrsLoading) {
        return <EllipsisLoader />;
    }
    return '-';
};

const getFileModifyTime = ({
    fileModifyTime,
    corruptedLink,
    isXattrsLoading,
}: {
    fileModifyTime?: number;
    corruptedLink?: boolean;
    isXattrsLoading?: boolean;
}) => {
    if (fileModifyTime && !corruptedLink) {
        return <TimeCell time={fileModifyTime} />;
    }
    if (isXattrsLoading) {
        return <EllipsisLoader />;
    }
    return '-';
};

function getTitle(link?: DecryptedLink) {
    if (link === undefined) {
        return c('Title').t`Item details`;
    }
    if (link.isFile) {
        return c('Title').t`File details`;
    }
    if (link.mimeType === 'Album') {
        return c('Title').t`Album details`;
    }
    return c('Title').t`Folder details`;
}

const DetailsModalContent = ({
    shareId,
    isFile,
    name,
    size,
    parentLinkId,
    mimeType,
    isSignatureIssuesLoading,
    signatureIssues,
    signatureIssuesEmail,
    signatureNetworkError,
    lastEditedEmail,
    ownerEmail,
    isNumberOfAccessesLoading = false,
    numberOfAccesses,
    photoContentHash,
    originalSize,
    sha1Digest,
    createTime,
    fileModifyTime,
    corruptedLink,
    isAnonymous,
    isSharedWithMeLink = false,
    isExpired,
    isShared,
    isXattrsLoading,
    getPath,
    anonymousView,
}: DetailsModalContentProps) => {
    return (
        <ModalTwoContent>
            {!anonymousView && (
                <SignatureAlert
                    loading={isSignatureIssuesLoading}
                    signatureIssues={signatureIssues}
                    signatureNetworkError={signatureNetworkError}
                    signatureEmail={signatureIssuesEmail}
                    isAnonymous={isAnonymous}
                    corruptedLink={corruptedLink}
                    mimeType={mimeType}
                    isFile={isFile}
                    name={name}
                    haveParentAccess={!!parentLinkId}
                    className="mb-4"
                />
            )}
            <DetailsRow label={c('Title').t`Name`}>
                <FileNameDisplay text={name} />
            </DetailsRow>
            {isSharedWithMeLink && (
                <DetailsRow label={c('Title').t`Location`}>
                    <FileNameDisplay text={`/${c('Info').t`Shared with me`}`} />
                </DetailsRow>
            )}
            {ownerEmail && !anonymousView && (
                <DetailsRow label={c('Title').t`Uploaded by`}>
                    <UserNameCell signatureEmail={ownerEmail} />
                </DetailsRow>
            )}
            {parentLinkId && !isSharedWithMeLink && getPath && (
                <DetailsRow label={c('Title').t`Location`}>
                    <LocationCell shareId={shareId} parentLinkId={parentLinkId} getPath={getPath} />
                </DetailsRow>
            )}
            {!!createTime && (
                <DetailsRow label={c('Title').t`Uploaded`}>
                    <TimeCell time={createTime} />
                </DetailsRow>
            )}
            {!!fileModifyTime && (
                <DetailsRow label={c('Title').t`Modified`}>
                    {getFileModifyTime({ fileModifyTime, isXattrsLoading, corruptedLink })}
                </DetailsRow>
            )}
            {isFile && (
                <>
                    {mimeType && (
                        <>
                            <DetailsRow label={c('Title').t`Type`}>
                                <DescriptiveTypeCell mimeType={mimeType} isFile={isFile} />
                            </DetailsRow>
                            <DetailsRow label={c('Title').t`MIME type`}>
                                <MimeTypeCell mimeType={mimeType} />
                            </DetailsRow>
                        </>
                    )}
                    <DetailsRow
                        label={
                            <>
                                {c('Title').t`Size`}
                                <Tooltip title={getSizeTooltipMessage()} className="ml-1 mb-1">
                                    <Icon name="info-circle" size={3.5} alt={getSizeTooltipMessage()} />
                                </Tooltip>
                            </>
                        }
                        dataTestId="file-size"
                    >
                        <span title={bytesSize(size)}>{humanSize({ bytes: size })}</span>
                    </DetailsRow>
                    <DetailsRow label={c('Title').t`Original size`}>
                        {getOriginalSize({ originalSize, isXattrsLoading })}
                    </DetailsRow>
                </>
            )}
            {lastEditedEmail && (
                <DetailsRow label={c('Title').t`Last edited by`} dataTestId={'drive:last-edited-by'}>
                    {lastEditedEmail}
                </DetailsRow>
            )}
            {isShared !== undefined && (
                <DetailsRow label={c('Title').t`Shared`} dataTestId={'drive:is-shared'}>
                    {isShared ? c('Info').t`Yes` : c('Info').t`No`}
                </DetailsRow>
            )}
            {isExpired && (
                <DetailsRow label={c('Title').t`Public shared link status`} dataTestId={'drive:public-sharing-status'}>
                    {isExpired ? c('Info').t`Expired` : c('Info').t`Available`}
                </DetailsRow>
            )}

            {(numberOfAccesses !== undefined || isNumberOfAccessesLoading) && (
                <DetailsRow
                    label={
                        <>
                            {c('Title').t`# of downloads`}
                            <Tooltip title={getNumAccessesTooltipMessage()} className="ml-1 mb-1">
                                <Icon name="info-circle" size={3.5} alt={getNumAccessesTooltipMessage()} />
                            </Tooltip>
                        </>
                    }
                >
                    {formatAccessCount(numberOfAccesses)}
                </DetailsRow>
            )}
            {sha1Digest && (
                // This should not be visible in the UI, but needed for e2e
                <span data-testid="drive:file-digest" className="hidden" aria-hidden="true">
                    {sha1Digest}
                </span>
            )}
            {photoContentHash && (
                // This should not be visible in the UI, but needed for e2e
                <span data-testid="drive:photo-contentHash" className="hidden" aria-hidden="true">
                    {photoContentHash}
                </span>
            )}
        </ModalTwoContent>
    );
};

export function RevisionDetailsModal({
    shareId,
    linkId,
    revision,
    name,
    onClose,
    ...modalProps
}: RevisionDetailsModalProps & ModalStateProps) {
    const { getRevisionDecryptedXattrs, checkRevisionSignature } = useRevisions(shareId, linkId);
    const [xattrs, setXattrs] = useState<ParsedExtendedAttributes>();
    const [signatureIssues, setSignatureIssues] = useState<SignatureIssues>();
    const [signatureNetworkError, setSignatureNetworkError] = useState<boolean>(false);
    const [isXattrsLoading, withXattrsLoading] = useLoading();
    const [isSignatureIssuesLoading, withSignatureIssuesLoading] = useLoading();
    useEffect(() => {
        const ac = new AbortController();
        void withXattrsLoading(
            getRevisionDecryptedXattrs(ac.signal, revision.xAttr, revision.signatureEmail).then((decryptedXattrs) => {
                if (!decryptedXattrs) {
                    return;
                }
                setXattrs(decryptedXattrs.xattrs);
                if (signatureIssues) {
                    setSignatureIssues({ ...signatureIssues, ...decryptedXattrs.signatureIssues });
                } else {
                    setSignatureIssues(decryptedXattrs.signatureIssues);
                }
            })
        );
        return () => {
            ac.abort();
        };
    }, [revision.xAttr, revision.signatureEmail]);

    useEffect(() => {
        const ac = new AbortController();
        void withSignatureIssuesLoading(
            checkRevisionSignature(ac.signal, revision.id).then((blocksSignatureIssues) => {
                if (signatureIssues) {
                    setSignatureIssues({ ...signatureIssues, ...blocksSignatureIssues });
                } else {
                    setSignatureIssues(blocksSignatureIssues);
                }
            })
        ).catch(() => {
            setSignatureNetworkError(true);
        });
        return () => {
            ac.abort();
        };
    }, [revision.id]);

    return (
        <ModalTwo onClose={onClose} size="large" {...modalProps}>
            <ModalTwoHeader title={c('Title').t`Version details`} />
            <DetailsModalContent
                isSignatureIssuesLoading={isSignatureIssuesLoading}
                signatureIssues={signatureIssues}
                signatureNetworkError={signatureNetworkError}
                signatureIssuesEmail={revision.signatureEmail}
                name={name}
                isFile
                isAnonymous={!revision.signatureEmail}
                createTime={revision.createTime}
                size={revision.size}
                fileModifyTime={xattrs?.Common.ModificationTime}
                originalSize={xattrs?.Common.Size}
                ownerEmail={revision.signatureEmail}
                shareId={shareId}
                photoContentHash={revision.photo?.contentHash}
                sha1Digest={xattrs?.Common.Digests?.SHA1}
                isXattrsLoading={isXattrsLoading}
            />
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
}

export function BaseDetailsModal({
    shareId,
    linkId,
    onClose,
    checkFirstBlockSignature,
    getPath,
    anonymousView,
    ...modalProps
}: BaseDetailsModalProps & ModalStateProps) {
    const {
        isLinkLoading,
        isSignatureIssuesLoading,
        isNumberOfAccessesLoading,
        isSharedWithMeLink,
        error,
        link,
        signatureIssues,
        signatureNetworkError,
        numberOfAccesses,
    } = useLinkDetailsView(shareId, linkId, checkFirstBlockSignature);

    const renderModalState = () => {
        if (isLinkLoading) {
            return <ModalContentLoader>{c('Info').t`Loading link`}</ModalContentLoader>;
        }

        if (!link || error) {
            return (
                <ModalTwoContent>
                    <Alert type="error">{c('Info').t`Cannot load link`}</Alert>
                </ModalTwoContent>
            );
        }

        return (
            <DetailsModalContent
                isSharedWithMeLink={isSharedWithMeLink}
                isSignatureIssuesLoading={isSignatureIssuesLoading}
                isNumberOfAccessesLoading={isNumberOfAccessesLoading}
                signatureIssues={signatureIssues}
                signatureNetworkError={signatureNetworkError}
                numberOfAccesses={numberOfAccesses}
                shareId={shareId}
                lastEditedEmail={link.activeRevision?.signatureEmail}
                ownerEmail={link.signatureEmail}
                signatureIssuesEmail={link.isFile ? link.activeRevision?.signatureEmail : link.signatureEmail}
                isAnonymous={link.isAnonymous}
                corruptedLink={link.corruptedLink}
                isFile={link.isFile}
                name={link.name}
                parentLinkId={link.parentLinkId}
                createTime={link.createTime}
                fileModifyTime={link.fileModifyTime}
                mimeType={link.mimeType}
                size={link.size}
                originalSize={link.originalSize}
                isExpired={link.sharingDetails?.shareUrl?.isExpired}
                isShared={link.isShared}
                sha1Digest={link.digests?.sha1}
                photoContentHash={link.activeRevision?.photo?.contentHash}
                getPath={getPath}
                anonymousView={anonymousView}
            />
        );
    };

    return (
        <ModalTwo onClose={onClose} size="large" {...modalProps}>
            <ModalTwoHeader title={getTitle(link)} />
            {renderModalState()}
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
}

export function DetailsModal(props: DetailsModalProps & ModalStateProps) {
    const { loadChildren, getCachedChildren } = useLinksListing();
    const { checkFirstBlockSignature } = useDownload({
        loadChildren,
        getCachedChildren,
    });
    const { getPath } = useLinkPath();
    return <BaseDetailsModal getPath={getPath} checkFirstBlockSignature={checkFirstBlockSignature} {...props} />;
}

export function PublicDetailsModal({ token, ...props }: PublicDetailsModalProps & ModalStateProps) {
    const { loadChildren, getCachedChildren } = usePublicLinksListing();
    const { request, user } = usePublicSession();
    const { checkFirstBlockSignature } = useDownload({
        loadChildren,
        getCachedChildren,
        customDebouncedRequest: request,
    });
    const { getPath } = useLinkPathPublic();
    return (
        <BaseDetailsModal
            shareId={token}
            getPath={getPath}
            checkFirstBlockSignature={checkFirstBlockSignature}
            anonymousView={!user}
            {...props}
        />
    );
}

function DetailsRow({ label, title, children, dataTestId }: RowProps) {
    return (
        <Row title={title}>
            <span className="label cursor-default">{label}</span>
            <div className="pt-2" data-testid={dataTestId}>
                <b>{children}</b>
            </div>
        </Row>
    );
}

export const useDetailsModal = () => {
    return useModalTwoStatic(DetailsModal);
};

export const usePublicDetailsModal = () => {
    return useModalTwoStatic(PublicDetailsModal);
};

export const useRevisionDetailsModal = () => {
    return useModalTwoStatic(RevisionDetailsModal);
};
