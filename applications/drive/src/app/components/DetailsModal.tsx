import { ReactNode, useState, useEffect } from 'react';
import { c } from 'ttag';

import { useLoading, Row, ModalTwo, ModalTwoFooter, Button, ModalTwoContent, ModalTwoHeader } from '@proton/components';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { SignatureIssues, useActions, useShareUrl } from '../store';
import { formatAccessCount } from '../utils/formatters';
import { useModal } from '../hooks/util/useModal';
import UserNameCell from './FileBrowser/ListView/Cells/UserNameCell';
import LocationCell from './FileBrowser/ListView/Cells/LocationCell';
import DescriptiveTypeCell from './FileBrowser/ListView/Cells/DescriptiveTypeCell';
import TimeCell from './FileBrowser/ListView/Cells/TimeCell';
import SizeCell from './FileBrowser/ListView/Cells/SizeCell';
import NameCell from './FileBrowser/ListView/Cells/NameCell';
import MIMETypeCell from './FileBrowser/ListView/Cells/MIMETypeCell';
import SignatureAlert from './SignatureAlert';

interface Props {
    shareId: string;
    item: FileBrowserItem;
    onClose?: () => void;
}

interface RowProps {
    label: string;
    children: ReactNode;
}

const DetailsRow = ({ label, children }: RowProps) => {
    return (
        <Row>
            <span className="label cursor-default">{label}</span>
            <div className="pt0-5">
                <b>{children}</b>
            </div>
        </Row>
    );
};

const DetailsModal = ({ shareId, item, onClose, ...rest }: Props) => {
    const isFile = item.Type === LinkType.FILE;
    const title = isFile ? c('Title').t`File details` : c('Title').t`Folder details`;
    const isShared = item.SharedUrl && !item.UrlsExpired ? c('Info').t`Yes` : c('Info').t`No`;
    const { isOpen, onClose: handleModalClose } = useModal(onClose);

    const { checkLinkSignatures } = useActions();
    const [signatureIssues, setSignatureIssues] = useState<SignatureIssues>();
    const [loadingSignatureIssues, withLoadingSignatureIssues] = useLoading();

    const { loadShareUrlNumberOfAccesses } = useShareUrl();
    const [numberOfAccesses, setNumberOfAccesses] = useState<number>();
    const [loadingNumberOfAccesses, withLoadingNumberOfAccesses] = useLoading();

    useEffect(() => {
        const abortController = new AbortController();
        withLoadingSignatureIssues(
            checkLinkSignatures(abortController.signal, shareId, item.LinkID).then(setSignatureIssues)
        );
        return () => {
            abortController.abort();
        };
    }, [shareId, item.LinkID]);

    useEffect(() => {
        if (!item.ShareUrlShareID) {
            return;
        }
        const abortController = new AbortController();
        withLoadingNumberOfAccesses(
            loadShareUrlNumberOfAccesses(abortController.signal, shareId, item.LinkID)
                .then(setNumberOfAccesses)
                .catch(console.error)
        );
        return () => {
            abortController.abort();
        };
    }, [shareId, item.LinkID, item.ShareUrlShareID]);

    return (
        <ModalTwo onClose={handleModalClose} open={isOpen} {...rest} size="large">
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <SignatureAlert
                    loading={loadingSignatureIssues}
                    signatureIssues={signatureIssues}
                    signatureAddress={item.SignatureAddress}
                    isFile={item.Type === LinkType.FILE}
                    name={item.Name}
                    className="mb1"
                />
                <DetailsRow label={c('Title').t`Name`}>
                    <NameCell name={item.Name} />
                </DetailsRow>
                <DetailsRow label={c('Title').t`Uploaded by`}>
                    <UserNameCell />
                </DetailsRow>
                <DetailsRow label={c('Title').t`Location`}>
                    <LocationCell shareId={shareId} parentLinkId={item.ParentLinkID} />
                </DetailsRow>
                <DetailsRow label={c('Title').t`Uploaded`}>
                    <TimeCell time={item.CreateTime} />
                </DetailsRow>
                <DetailsRow label={c('Title').t`Modified`}>
                    <TimeCell time={item.RealModifyTime} />
                </DetailsRow>
                {isFile && (
                    <>
                        <DetailsRow label={c('Title').t`Type`}>
                            <DescriptiveTypeCell mimeType={item.MIMEType} linkType={item.Type} />
                        </DetailsRow>
                        <DetailsRow label={c('Title').t`MIME type`}>
                            <MIMETypeCell mimeType={item.MIMEType} />
                        </DetailsRow>
                        <DetailsRow label={c('Title').t`Size`}>
                            <SizeCell size={item.Size} />
                        </DetailsRow>
                    </>
                )}
                <DetailsRow label={c('Title').t`Shared`}>{isShared}</DetailsRow>
                {(numberOfAccesses !== undefined || loadingNumberOfAccesses) && (
                    <DetailsRow label={c('Title').t`# of accesses`}>{formatAccessCount(numberOfAccesses)}</DetailsRow>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={handleModalClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DetailsModal;
