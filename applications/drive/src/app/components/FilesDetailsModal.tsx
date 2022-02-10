import { c } from 'ttag';

import {
    Row,
    Label,
    Field,
    DialogModal,
    HeaderModal,
    InnerModal,
    FooterModal,
    PrimaryButton,
} from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { LinkType } from '../store';
import SizeCell from './FileBrowser/ListView/Cells/SizeCell';

interface Props {
    selectedItems: FileBrowserItem[];
    onClose?: () => void;
}

const FilesDetailsModal = ({ selectedItems, onClose, ...rest }: Props) => {
    const modalTitleID = 'files-details-modal';
    const size = selectedItems.reduce((sum, current) => sum + current.Size, 0);

    const hasFile = selectedItems.some(({ Type }) => Type === LinkType.FILE);
    const hasFolder = selectedItems.some(({ Type }) => Type === LinkType.FOLDER);
    const hasBoth = hasFile && hasFolder;

    const title = hasBoth
        ? c('Title').t`Items details`
        : hasFile
        ? c('Title').t`Files details`
        : c('Title').t`Folders details`;
    const labelCount = hasBoth
        ? c('Title').t`Number of items`
        : hasFile
        ? c('Title').t`Number of files`
        : c('Title').t`Number of folders`;

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal modalTitleID={modalTitleID} onClose={onClose}>
                {title}
            </HeaderModal>
            <div className="modal-content">
                <InnerModal>
                    <Row>
                        <Label style={{ cursor: 'default' }}>{labelCount}</Label>
                        <Field className="pt0-5">
                            <b>{selectedItems.length}</b>
                        </Field>
                    </Row>
                    <Row>
                        <Label style={{ cursor: 'default' }}>{c('Title').t`Total size`}</Label>
                        <Field className="pt0-5">
                            <b>
                                <SizeCell size={size} />
                            </b>
                        </Field>
                    </Row>
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

export default FilesDetailsModal;
