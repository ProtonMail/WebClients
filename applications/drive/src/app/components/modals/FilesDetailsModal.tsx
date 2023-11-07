import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Alert,
    Field,
    Label,
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Row,
    useModalTwo,
} from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { DecryptedLink, useLinksDetailsView } from '../../store';
import ModalContentLoader from './ModalContentLoader';

interface Props {
    selectedItems: DecryptedLink[];
    onClose?: () => void;
}

const FilesDetailsModal = ({ selectedItems, onClose, ...modalProps }: Props & ModalStateProps) => {
    const { isLoading, hasError, count, size } = useLinksDetailsView(selectedItems);

    let title = c('Title').t`Item details`;
    let labelCount = c('Title').t`Number of items`;

    const renderModalState = () => {
        if (isLoading) {
            return <ModalContentLoader>{c('Info').t`Loading links`}</ModalContentLoader>;
        }

        if (hasError) {
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
                    <Field className="pt-2">
                        <b data-testid="number-of-items">{count}</b>
                    </Field>
                </Row>
                <Row>
                    <Label style={{ cursor: 'default' }}>{c('Title').t`Total size`}</Label>
                    <Field className="pt-2">
                        <b>{humanSize(size)}</b>
                    </Field>
                </Row>
            </ModalTwoContent>
        );
    };

    return (
        <ModalTwo onClose={onClose} size="large" {...modalProps}>
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
    return useModalTwo<Props, void>(FilesDetailsModal, false);
};
