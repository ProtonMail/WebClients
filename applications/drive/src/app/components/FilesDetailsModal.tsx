import { c } from 'ttag';

import {
    Row,
    Label,
    Field,
    ModalTwo,
    Button,
    ModalTwoHeader,
    ModalTwoContent,
    ModalTwoFooter,
} from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import SizeCell from './FileBrowser/ListView/Cells/SizeCell';

interface Props {
    selectedItems: FileBrowserItem[];
    onClose?: () => void;
    open?: boolean;
}

const FilesDetailsModal = ({ selectedItems, onClose, open }: Props) => {
    const size = selectedItems.reduce((sum, current) => sum + current.Size, 0);

    const hasFile = selectedItems.some(({ IsFile }) => IsFile);
    const hasFolder = selectedItems.some(({ IsFile }) => !IsFile);
    const hasBoth = hasFile && hasFolder;

    let title = c('Title').t`Items details`;
    let labelCount = c('Title').t`Number of items`;
    if (!hasBoth) {
        title = hasFile ? c('Title').t`Files details` : c('Title').t`Folders details`;
        labelCount = hasFile ? c('Title').t`Number of files` : c('Title').t`Number of folders`;
    }

    return (
        <ModalTwo onClose={onClose} open={open} size="large">
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
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
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default FilesDetailsModal;
