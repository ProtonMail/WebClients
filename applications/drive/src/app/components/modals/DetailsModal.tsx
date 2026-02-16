import type { ReactNode } from 'react';

import { getUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { ModalStateProps } from '@proton/components';
import {
    Alert,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Row,
    useModalTwoStatic,
} from '@proton/components';
import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import { VERIFICATION_STATUS } from '@proton/crypto';
import type { Revision } from '@proton/drive';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { getNumAccessesTooltipMessage, getSizeTooltipMessage } from '@proton/shared/lib/drive/translations';
import humanSize, { bytesSize } from '@proton/shared/lib/helpers/humanSize';

import type { useLinkPath } from '../../store';
import { type SignatureIssues, useLinkDetailsView } from '../../store';
import { usePublicSession } from '../../store/_api';
import { useDownload } from '../../store/_downloads';
import { type DecryptedLink, usePublicLinksListing } from '../../store/_links';
import { useLinkPathPublic } from '../../store/_views/useLinkPath';
import { formatAccessCount } from '../../utils/formatters';
import { Cells } from '../FileBrowser';
import { FileName } from '../FileName';
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
    revision: Revision;
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
                <FileName text={name} />
            </DetailsRow>
            {isSharedWithMeLink && (
                <DetailsRow label={c('Title').t`Location`}>
                    <FileName
                        text={mimeType === 'Album' ? `/${c('Info').t`Photos`}` : `/${c('Info').t`Shared with me`}`}
                    />
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
                                    <IcInfoCircle size={3.5} alt={getSizeTooltipMessage()} />
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
                                <IcInfoCircle size={3.5} alt={getNumAccessesTooltipMessage()} />
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
    const signatureEmail =
        (revision.contentAuthor.ok ? revision.contentAuthor.value : revision.contentAuthor.error.claimedAuthor) || '';
    const signatureIssues = revision.contentAuthor.ok
        ? undefined
        : {
              xattrs: VERIFICATION_STATUS.SIGNED_AND_INVALID,
          };

    return (
        <ModalTwo onClose={onClose} size="large" {...modalProps}>
            <ModalTwoHeader title={c('Title').t`Version details`} />
            <DetailsModalContent
                isSignatureIssuesLoading={false}
                signatureIssues={signatureIssues}
                signatureIssuesEmail={signatureEmail}
                name={name}
                isFile
                isAnonymous={revision.contentAuthor.ok && revision.contentAuthor.value === null}
                createTime={getUnixTime(revision.creationTime)}
                size={revision.storageSize}
                fileModifyTime={revision.claimedModificationTime && getUnixTime(revision.claimedModificationTime)}
                originalSize={revision.claimedSize}
                ownerEmail={signatureEmail}
                shareId={shareId}
                sha1Digest={revision.claimedDigests?.sha1}
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
    open,
    onExit,
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
        <ModalTwo onClose={onClose} size="large" open={open} onExit={onExit}>
            <ModalTwoHeader title={getTitle(link)} />
            {renderModalState()}
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
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

export const usePublicDetailsModal = () => {
    return useModalTwoStatic(PublicDetailsModal);
};

export const useRevisionDetailsModal = () => {
    return useModalTwoStatic(RevisionDetailsModal);
};
