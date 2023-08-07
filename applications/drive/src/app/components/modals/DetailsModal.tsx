import { ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Alert,
    FileNameDisplay,
    Icon,
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Row,
    Tooltip,
    useModalTwo,
} from '@proton/components';
import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import { useLoading } from '@proton/hooks';
import humanSize, { bytesSize } from '@proton/shared/lib/helpers/humanSize';
import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

import { SignatureIssues, useLinkDetailsView } from '../../store';
import { ParsedExtendedAttributes } from '../../store/_links/extendedAttributes';
import useRevisions from '../../store/_revisions/useRevisions';
import { formatAccessCount } from '../../utils/formatters';
import { Cells } from '../FileBrowser';
import SignatureAlert from '../SignatureAlert';
import ModalContentLoader from './ModalContentLoader';

const { UserNameCell, LocationCell, TimeCell, DescriptiveTypeCell, MimeTypeCell } = Cells;
export interface Props {
    shareId: string;
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

const sizeTooltipMessage = c('Info')
    .t`The encrypted data is slightly larger due to the overhead of the encryption and signatures, which ensure the security of your data.`;

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
    const [isLoading, withIsLoading] = useLoading();
    const [isSignatureLoading, withSignatureLoading] = useLoading();
    useEffect(() => {
        const ac = new AbortController();
        void withIsLoading(
            getRevisionDecryptedXattrs(ac.signal, revision.XAttr, revision.SignatureAddress).then((decryptedXattrs) => {
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
    }, [revision.XAttr, revision.SignatureAddress]);

    useEffect(() => {
        const ac = new AbortController();
        void withSignatureLoading(
            checkRevisionSignature(ac.signal, revision.ID).then((blocksSignatureIssues) => {
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
    }, [revision.ID]);
    const renderModalState = () => {
        return (
            <ModalTwoContent>
                <SignatureAlert
                    loading={isSignatureLoading}
                    signatureIssues={signatureIssues}
                    signatureNetworkError={signatureNetworkError}
                    signatureAddress={revision.SignatureAddress}
                    isFile
                    name={name}
                    className="mb-4"
                />
                <DetailsRow label={c('Title').t`Name`}>
                    <FileNameDisplay text={name} />
                </DetailsRow>
                <DetailsRow label={c('Title').t`Uploaded by`}>
                    <span className="text-pre">{revision.SignatureEmail}</span>
                </DetailsRow>
                <DetailsRow label={c('Title').t`Uploaded`}>
                    <TimeCell time={revision.CreateTime} />
                </DetailsRow>
                <DetailsRow label={c('Title').t`Modified`}>
                    {xattrs?.Common.ModificationTime ? (
                        <TimeCell time={xattrs.Common.ModificationTime} />
                    ) : isLoading ? (
                        <EllipsisLoader />
                    ) : (
                        '-'
                    )}
                </DetailsRow>
                <DetailsRow
                    label={
                        <>
                            {c('Title').t`Size`}
                            <Tooltip title={sizeTooltipMessage} className="ml-1 mb-1">
                                <Icon name="info-circle" size={14} alt={sizeTooltipMessage} />
                            </Tooltip>
                        </>
                    }
                >
                    <span title={bytesSize(revision.Size)}>{humanSize(revision.Size)}</span>
                </DetailsRow>
                <DetailsRow label={c('Title').t`Original size`}>
                    {xattrs?.Common.Size ? (
                        <span title={bytesSize(xattrs?.Common.Size)}>{humanSize(xattrs?.Common.Size)}</span>
                    ) : isLoading ? (
                        <EllipsisLoader />
                    ) : (
                        '-'
                    )}
                </DetailsRow>
                {xattrs?.Common.Digests && (
                    // This should not be visible in the UI, but needed for e2e
                    <span data-testid="drive:file-digest" className="hidden" aria-hidden="true">
                        {xattrs.Common.Digests.SHA1}
                    </span>
                )}
            </ModalTwoContent>
        );
    };

    return (
        <ModalTwo onClose={onClose} size="large" {...modalProps}>
            <ModalTwoHeader title={c('Title').t`Version details`} />
            {renderModalState()}
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
}

export default function DetailsModal({ shareId, linkId, onClose, ...modalProps }: Props & ModalStateProps) {
    const {
        isLinkLoading,
        isSignatureIssuesLoading,
        isNumberOfAccessesLoading,
        error,
        link,
        signatureIssues,
        signatureNetworkError,
        numberOfAccesses,
    } = useLinkDetailsView(shareId, linkId);

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

        const isShared = link.shareUrl && !link.shareUrl.isExpired ? c('Info').t`Yes` : c('Info').t`No`;
        return (
            <ModalTwoContent>
                <SignatureAlert
                    loading={isSignatureIssuesLoading}
                    signatureIssues={signatureIssues}
                    signatureNetworkError={signatureNetworkError}
                    signatureAddress={link.signatureAddress}
                    isFile={link.isFile}
                    name={link.name}
                    className="mb-4"
                />
                <DetailsRow label={c('Title').t`Name`}>
                    <FileNameDisplay text={link.name} />
                </DetailsRow>
                <DetailsRow label={c('Title').t`Uploaded by`}>
                    <UserNameCell />
                </DetailsRow>
                {link.parentLinkId && (
                    <DetailsRow label={c('Title').t`Location`}>
                        <LocationCell shareId={shareId} parentLinkId={link.parentLinkId} />
                    </DetailsRow>
                )}
                <DetailsRow label={c('Title').t`Uploaded`}>
                    <TimeCell time={link.createTime} />
                </DetailsRow>
                <DetailsRow label={c('Title').t`Modified`}>
                    {link.corruptedLink ? '-' : <TimeCell time={link.fileModifyTime} />}
                </DetailsRow>
                {link.isFile && (
                    <>
                        <DetailsRow label={c('Title').t`Type`}>
                            <DescriptiveTypeCell mimeType={link.mimeType} isFile={link.isFile} />
                        </DetailsRow>
                        <DetailsRow label={c('Title').t`MIME type`}>
                            <MimeTypeCell mimeType={link.mimeType} />
                        </DetailsRow>
                        <DetailsRow
                            label={
                                <>
                                    {c('Title').t`Size`}
                                    <Tooltip title={sizeTooltipMessage} className="ml-1 mb-1">
                                        <Icon name="info-circle" size={14} alt={sizeTooltipMessage} />
                                    </Tooltip>
                                </>
                            }
                        >
                            <span title={bytesSize(link.size)}>{humanSize(link.size)}</span>
                        </DetailsRow>
                        {link.originalSize && (
                            <DetailsRow label={c('Title').t`Original size`}>
                                <span title={bytesSize(link.originalSize)}>{humanSize(link.originalSize)}</span>
                            </DetailsRow>
                        )}
                    </>
                )}
                <DetailsRow label={c('Title').t`Shared`} dataTestId={'drive:is-shared'}>
                    {isShared}
                </DetailsRow>
                {(numberOfAccesses !== undefined || isNumberOfAccessesLoading) && (
                    <DetailsRow label={c('Title').t`# of downloads`}>{formatAccessCount(numberOfAccesses)}</DetailsRow>
                )}
                {link.digests && (
                    // This should not be visible in the UI, but needed for e2e
                    <span data-testid="drive:file-digest" className="hidden" aria-hidden="true">
                        {link.digests.sha1}
                    </span>
                )}
            </ModalTwoContent>
        );
    };

    return (
        <ModalTwo onClose={onClose} size="large" {...modalProps}>
            <ModalTwoHeader title={getTitle(link?.isFile)} />
            {renderModalState()}
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
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

function getTitle(isFile?: boolean) {
    if (isFile === undefined) {
        return c('Title').t`Item details`;
    }
    return isFile ? c('Title').t`File details` : c('Title').t`Folder details`;
}

export const useDetailsModal = () => {
    return useModalTwo<Props, unknown>(DetailsModal, false);
};
export const useRevisionDetailsModal = () => {
    return useModalTwo<RevisionDetailsModalProps, unknown>(RevisionDetailsModal, false);
};
