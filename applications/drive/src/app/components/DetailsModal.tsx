import React, { ReactNode } from 'react';
import { c } from 'ttag';

import { FEATURE_FLAGS } from 'proton-shared/lib/constants';
import { Row, Label, Field, DialogModal, HeaderModal, InnerModal, FooterModal, PrimaryButton } from 'react-components';
import { LinkType } from '../interfaces/link';
import { DriveFolder } from './Drive/DriveFolderProvider';
import { FileBrowserItem } from './FileBrowser/interfaces';
import UserNameCell from './FileBrowser/ListView/Cells/UserNameCell';
import LocationCell from './FileBrowser/ListView/Cells/LocationCell';
import DescriptiveTypeCell from './FileBrowser/ListView/Cells/DescriptiveTypeCell';
import TimeCell from './FileBrowser/ListView/Cells/TimeCell';
import SizeCell from './FileBrowser/ListView/Cells/SizeCell';
import NameCell from './FileBrowser/ListView/Cells/NameCell';
import MIMETypeCell from './FileBrowser/ListView/Cells/MIMETypeCell';

interface Props {
    item: FileBrowserItem;
    activeFolder: DriveFolder;
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

const DetailsModal = ({ activeFolder, item, onClose, ...rest }: Props) => {
    const includeDriveSharing = FEATURE_FLAGS.includes('drive-sharing');
    const modalTitleID = 'details-modal';
    const isFile = item.Type === LinkType.FILE;
    const title = isFile ? c('Title').t`File Details` : c('Title').t`Folder Details`;
    const isShared = item.SharedURLShareID ? c('Info').t`Yes` : c('Info').t`No`;

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal modalTitleID={modalTitleID} onClose={onClose}>
                {title}
            </HeaderModal>
            <div className="pm-modalContent">
                <InnerModal>
                    <DetailsRow label={c('Title').t`Name`}>
                        <NameCell name={item.Name} />
                    </DetailsRow>
                    <DetailsRow label={c('Title').t`Uploaded by`}>
                        <UserNameCell />
                    </DetailsRow>
                    <DetailsRow label={c('Title').t`Location`}>
                        <LocationCell shareId={activeFolder.shareId} parentLinkId={item.ParentLinkID} />
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
                            {includeDriveSharing && <DetailsRow label={c('Title').t`Shared`}>{isShared}</DetailsRow>}
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
