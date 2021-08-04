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

import { FileBrowserItem } from './FileBrowser/interfaces';
import SizeCell from './FileBrowser/ListView/Cells/SizeCell';

interface Props {
    selectedItems: FileBrowserItem[];
    onClose?: () => void;
}

const FilesDetailsModal = ({ selectedItems, onClose, ...rest }: Props) => {
    const modalTitleID = 'files-details-modal';
    const size = selectedItems.reduce((sum, current) => sum + current.Size, 0);

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal modalTitleID={modalTitleID} onClose={onClose}>
                {c('Title').t`Files details`}
            </HeaderModal>
            <div className="modal-content">
                <InnerModal>
                    <Row>
                        <Label style={{ cursor: 'default' }}>{c('Title').t`Number of files`}</Label>
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
