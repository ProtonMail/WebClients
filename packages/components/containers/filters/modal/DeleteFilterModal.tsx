import { c } from 'ttag';

import { AlertModal, Button, ModalProps } from '../../../components';

interface Props extends ModalProps {
    filterName: string;
    handleDelete: () => void;
}

const DeleteFilterModal = ({ filterName, handleDelete, ...rest }: Props) => {
    const { onClose } = rest;

    const deleteFilter = () => {
        onClose?.();
        handleDelete();
    };

    return (
        <AlertModal
            title={c('Title').t`Delete ${filterName}`}
            buttons={[
                <Button color="danger" onClick={deleteFilter}>{c('Action').t`Delete`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Info')
                .t`Please note that if you delete this filter, we will stop processing all the automated actions it triggers.`}
            <br />
            {c('Info').t`Are you sure you want to delete this filter?`}
        </AlertModal>
    );
};

export default DeleteFilterModal;
