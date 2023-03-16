import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Alert,
    Field,
    Label,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Row,
} from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { DecryptedLink, useLinksDetailsView } from '../store';
import ModalContentLoader from './ModalContentLoader';

interface Props {
    selectedItems: DecryptedLink[];
    onClose?: () => void;
    open?: boolean;
}

const FilesDetailsModal = ({ selectedItems, onClose, open }: Props) => {
    const { isLoading, error, hasFile, hasFolder, count, size } = useLinksDetailsView(selectedItems);

    let title = c('Title').t`Item details`;
    let labelCount = c('Title').t`Number of items`;
    if (!hasFile || !hasFolder) {
        title = hasFile ? c('Title').t`Files details` : c('Title').t`Folders details`;
        labelCount = hasFile ? c('Title').t`Number of files` : c('Title').t`Number of folders`;
    }

    const renderModalState = () => {
        if (isLoading) {
            return <ModalContentLoader>{c('Info').t`Loading links`}</ModalContentLoader>;
        }

        if (error) {
            return (
                <ModalTwoContent>
                    <Alert type="error">{c('Info').t`Cannot load links`}</Alert>
                </ModalTwoContent>
            );
        }

        return (
            <ModalTwoContent>
                <Row>
                    <Label style={{ cursor: 'default' }}>{labelCount}</Label>
                    <Field className="pt0-5">
                        <b>{count}</b>
                    </Field>
                </Row>
                <Row>
                    <Label style={{ cursor: 'default' }}>{c('Title').t`Total size`}</Label>
                    <Field className="pt0-5">
                        <b>{humanSize(size)}</b>
                    </Field>
                </Row>
            </ModalTwoContent>
        );
    };

    return (
        <ModalTwo onClose={onClose} open={open} size="large">
            <ModalTwoHeader title={title} />
            {renderModalState()}
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default FilesDetailsModal;
export const useFilesDetailsModal = () => {
    return useModalTwo<Props, unknown>(FilesDetailsModal);
};
