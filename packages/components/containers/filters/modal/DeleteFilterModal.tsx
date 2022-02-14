import { c } from 'ttag';

import { Alert, Button, Form, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../components';

interface Props {
    filterName: string;
    handleDelete: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const DeleteFilterModal = ({ filterName, handleDelete, isOpen, onClose }: Props) => {
    return (
        <ModalTwo onClose={onClose} open={isOpen} as={Form} onSubmit={handleDelete}>
            <ModalTwoHeader title={c('Title').t`Delete ${filterName}`} />
            <ModalTwoContent>
                <Alert className="mb1" type="info">{c('Info')
                    .t`Please note that if you delete this filter, we will stop processing all the automated actions it triggers.`}</Alert>
                <Alert className="mb1" type="error">{c('Info').t`Are you sure you want to delete this filter?`}</Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="danger" type="submit">{c('Action').t`Delete`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DeleteFilterModal;
