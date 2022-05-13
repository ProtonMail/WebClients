import { ReactNode } from 'react';
import { c } from 'ttag';

import { Alert, Row, ModalTwo, ModalTwoFooter, Button, ModalTwoContent, ModalTwoHeader } from '@proton/components';

import { useLinkDetailsView } from '../store';
import { formatAccessCount } from '../utils/formatters';
import UserNameCell from './FileBrowser/ListView/Cells/UserNameCell';
import LocationCell from './FileBrowser/ListView/Cells/LocationCell';
import DescriptiveTypeCell from './FileBrowser/ListView/Cells/DescriptiveTypeCell';
import TimeCell from './FileBrowser/ListView/Cells/TimeCell';
import SizeCell from './FileBrowser/ListView/Cells/SizeCell';
import NameCell from './FileBrowser/ListView/Cells/NameCell';
import MIMETypeCell from './FileBrowser/ListView/Cells/MIMETypeCell';
import ModalContentLoader from './ModalContentLoader';
import SignatureAlert from './SignatureAlert';

interface Props {
    shareId: string;
    linkId: string;
    onClose?: () => void;
    open?: boolean;
}

interface RowProps {
    label: string;
    children: ReactNode;
}

export default function DetailsModal({ shareId, linkId, onClose, open }: Props) {
    const {
        isLinkLoading,
        isSignatureIssuesLoading,
        isNumberOfAccessesLoading,
        error,
        link,
        signatureIssues,
        numberOfAccesses,
    } = useLinkDetailsView(shareId, linkId);

    const renderModalState = () => {
        if (isLinkLoading) {
            return <ModalContentLoader>{c('Info').t`Loading link`}</ModalContentLoader>;
        }

        if (!link || error) {
            return (
                <ModalTwoContent>
                    <Alert type="error">{c('Info').t`Link failed to be loaded`}</Alert>
                </ModalTwoContent>
            );
        }

        const isShared = link.shareUrl && !link.shareUrl.isExpired ? c('Info').t`Yes` : c('Info').t`No`;
        return (
            <ModalTwoContent>
                <SignatureAlert
                    loading={isSignatureIssuesLoading}
                    signatureIssues={signatureIssues}
                    signatureAddress={link.signatureAddress}
                    isFile={link.isFile}
                    name={link.name}
                    className="mb1"
                />
                <DetailsRow label={c('Title').t`Name`}>
                    <NameCell name={link.name} />
                </DetailsRow>
                <DetailsRow label={c('Title').t`Uploaded by`}>
                    <UserNameCell />
                </DetailsRow>
                <DetailsRow label={c('Title').t`Location`}>
                    <LocationCell shareId={shareId} parentLinkId={link.parentLinkId} />
                </DetailsRow>
                <DetailsRow label={c('Title').t`Uploaded`}>
                    <TimeCell time={link.createTime} />
                </DetailsRow>
                <DetailsRow label={c('Title').t`Modified`}>
                    <TimeCell time={link.fileModifyTime} />
                </DetailsRow>
                {link.isFile && (
                    <>
                        <DetailsRow label={c('Title').t`Type`}>
                            <DescriptiveTypeCell mimeType={link.mimeType} isFile={link.isFile} />
                        </DetailsRow>
                        <DetailsRow label={c('Title').t`MIME type`}>
                            <MIMETypeCell mimeType={link.mimeType} />
                        </DetailsRow>
                        <DetailsRow label={c('Title').t`Size`}>
                            <SizeCell size={link.size} />
                        </DetailsRow>
                    </>
                )}
                <DetailsRow label={c('Title').t`Shared`}>{isShared}</DetailsRow>
                {(numberOfAccesses !== undefined || isNumberOfAccessesLoading) && (
                    <DetailsRow label={c('Title').t`# of accesses`}>{formatAccessCount(numberOfAccesses)}</DetailsRow>
                )}
            </ModalTwoContent>
        );
    };

    return (
        <ModalTwo onClose={onClose} open={open} size="large">
            <ModalTwoHeader title={getTitle(link?.isFile)} />
            {renderModalState()}
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
}

function DetailsRow({ label, children }: RowProps) {
    return (
        <Row>
            <span className="label cursor-default">{label}</span>
            <div className="pt0-5">
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
