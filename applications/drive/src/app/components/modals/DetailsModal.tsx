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

import type { DriveFileRevision, SignatureIssues } from '../../store';
import { useLinkDetailsView } from '../../store';
import type { ParsedExtendedAttributes } from '../../store/_links/extendedAttributes';
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
            getRevisionDecryptedXattrs(ac.signal, revision.xAttr, revision.signatureAddress).then((decryptedXattrs) => {
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
    }, [revision.xAttr, revision.signatureAddress]);

    useEffect(() => {
        const ac = new AbortController();
        void withSignatureLoading(
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
    const renderModalState = () => {
        return (
            <ModalTwoContent>
                <SignatureAlert
                    loading={isSignatureLoading}
                    signatureIssues={signatureIssues}
                    signatureNetworkError={signatureNetworkError}
                    signatureAddress={revision.signatureAddress}
                    isFile
                    name={name}
                    className="mb-4"
                />
                <DetailsRow label={c('Title').t`Name`}>
                    <FileNameDisplay text={name} />
                </DetailsRow>
                <DetailsRow label={c('Title').t`Uploaded by`}>
                    <span className="text-pre">{revision.signatureEmail}</span>
                </DetailsRow>
                <DetailsRow label={c('Title').t`Uploaded`}>
                    <TimeCell time={revision.createTime} />
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
                            <Tooltip
                                title={c('Info')
                                    .t`The encrypted data is slightly larger due to the overhead of the encryption and signatures, which ensure the security of your data.`}
                                className="ml-1 mb-1"
                            >
                                <Icon
                                    name="info-circle"
                                    size={3.5}
                                    alt={c('Info')
                                        .t`The encrypted data is slightly larger due to the overhead of the encryption and signatures, which ensure the security of your data.`}
                                />
                            </Tooltip>
                        </>
                    }
                >
                    <span title={bytesSize(revision.size)}>{humanSize({ bytes: revision.size })}</span>
                </DetailsRow>
                <DetailsRow label={c('Title').t`Original size`}>
                    {xattrs?.Common.Size ? (
                        <span title={bytesSize(xattrs?.Common.Size)}>{humanSize({ bytes: xattrs?.Common.Size })}</span>
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
        isSharedWithMeLink,
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

        return (
            <ModalTwoContent>
                <SignatureAlert
                    loading={isSignatureIssuesLoading}
                    signatureIssues={signatureIssues}
                    signatureNetworkError={signatureNetworkError}
                    signatureAddress={link.signatureAddress}
                    corruptedLink={link.corruptedLink}
                    isFile={link.isFile}
                    name={link.name}
                    className="mb-4"
                />
                <DetailsRow label={c('Title').t`Name`}>
                    <FileNameDisplay text={link.name} />
                </DetailsRow>
                {isSharedWithMeLink ? (
                    <DetailsRow label={c('Title').t`Location`}>
                        <FileNameDisplay text={`/${c('Info').t`Shared with me`}`} />
                    </DetailsRow>
                ) : (
                    <DetailsRow label={c('Title').t`Uploaded by`}>
                        <UserNameCell />
                    </DetailsRow>
                )}
                {link.parentLinkId && !isSharedWithMeLink && (
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
                                    <Tooltip title={getSizeTooltipMessage()} className="ml-1 mb-1">
                                        <Icon name="info-circle" size={3.5} alt={getSizeTooltipMessage()} />
                                    </Tooltip>
                                </>
                            }
                            dataTestId="file-size"
                        >
                            <span title={bytesSize(link.size)}>{humanSize({ bytes: link.size })}</span>
                        </DetailsRow>
                        {link.originalSize !== undefined && (
                            <DetailsRow label={c('Title').t`Original size`}>
                                <span title={bytesSize(link.originalSize)}>
                                    {humanSize({ bytes: link.originalSize })}
                                </span>
                            </DetailsRow>
                        )}
                    </>
                )}
                {link.activeRevision?.signatureAddress && (
                    <DetailsRow label={c('Title').t`Last edited by`} dataTestId={'drive:last-edited-by'}>
                        {link.activeRevision?.signatureAddress}
                    </DetailsRow>
                )}
                <DetailsRow label={c('Title').t`Shared`} dataTestId={'drive:is-shared'}>
                    {link.isShared ? c('Info').t`Yes` : c('Info').t`No`}
                </DetailsRow>
                {link.sharingDetails?.shareUrl && (
                    <DetailsRow
                        label={c('Title').t`Public shared link status`}
                        dataTestId={'drive:public-sharing-status'}
                    >
                        {link.sharingDetails.shareUrl.isExpired ? c('Info').t`Expired` : c('Info').t`Available`}
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
                {link.digests && (
                    // This should not be visible in the UI, but needed for e2e
                    <span data-testid="drive:file-digest" className="hidden" aria-hidden="true">
                        {link.digests.sha1}
                    </span>
                )}
                {link.activeRevision?.photo?.contentHash && (
                    // This should not be visible in the UI, but needed for e2e
                    <span data-testid="drive:photo-contentHash" className="hidden" aria-hidden="true">
                        {link.activeRevision.photo.contentHash}
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
    return useModalTwoStatic(DetailsModal);
};
export const useRevisionDetailsModal = () => {
    return useModalTwoStatic(RevisionDetailsModal);
};
