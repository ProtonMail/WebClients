import React, { ReactNode } from 'react';
import { c } from 'ttag';

import { Row, Label, Field, DialogModal, HeaderModal, InnerModal, FooterModal, PrimaryButton } from 'react-components';
import { LinkType } from '../interfaces/link';
import { FileBrowserItem } from './FileBrowser/interfaces';
import UserNameCell from './FileBrowser/ListView/Cells/UserNameCell';
import LocationCell from './FileBrowser/ListView/Cells/LocationCell';
import DescriptiveTypeCell from './FileBrowser/ListView/Cells/DescriptiveTypeCell';
import TimeCell from './FileBrowser/ListView/Cells/TimeCell';
import SizeCell from './FileBrowser/ListView/Cells/SizeCell';
import NameCell from './FileBrowser/ListView/Cells/NameCell';
import MIMETypeCell from './FileBrowser/ListView/Cells/MIMETypeCell';

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
            <Label style={{ cursor: 'default' }}>{label}</Label>
            <Field className="pt0-5">
                <b>{children}</b>
            </Field>
        </Row>
    );
};

const DetailsModal = ({ shareId, item, onClose, ...rest }: Props) => {
    const modalTitleID = 'details-modal';
    const isFile = item.Type === LinkType.FILE;
    const title = isFile ? c('Title').t`File details` : c('Title').t`Folder details`;
    const isShared = item.SharedUrl && !item.UrlsExpired ? c('Info').t`Yes` : c('Info').t`No`;

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal modalTitleID={modalTitleID} onClose={onClose}>
                {title}
            </HeaderModal>
            <div className="modal-content">
                <InnerModal>
                    <DetailsRow label={c('Title').t`Name`}>
                        <NameCell name={item.Name} />
                    </DetailsRow>
                    <DetailsRow label={c('Title').t`Uploaded by`}>
                        <UserNameCell />
                    </DetailsRow>
                    <DetailsRow label={c('Title').t`Location`}>
                        <LocationCell shareId={shareId} parentLinkId={item.ParentLinkID} />
                    </DetailsRow>
                    <DetailsRow label={c('Title').t`Modified`}>
                        <TimeCell time={item.ModifyTime} />
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
                            <DetailsRow label={c('Title').t`Shared`}>{isShared}</DetailsRow>
                        </>
                    )}
                </InnerModal>
                <FooterModal>
                    <PrimaryButton onClick={onClose} autoFocus>
                        {c('Action').t`Close`}
                    </PrimaryButton>
                </FooterModal>
            </div>
        </DialogModal>
    );
};

export default DetailsModal;
