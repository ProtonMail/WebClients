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

import { LinkType } from '../store';
import SizeCell from './FileBrowser/ListView/Cells/SizeCell';

interface Props {
    selectedItems: FileBrowserItem[];
    onClose?: () => void;
    open?: boolean;
}

const FilesDetailsModal = ({ selectedItems, onClose, open }: Props) => {
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
