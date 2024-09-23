import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';

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

    const nameDeleted = (
        <strong className="text-ellipsis inline-block max-w-full align-bottom" title={filterName}>
            {filterName}
        </strong>
    );

    return (
        <Prompt
            title={c('Title').t`Delete filter?`}
            buttons={[
                <Button color="danger" onClick={deleteFilter}>{c('Action').t`Delete`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {
                // translator: ${nameDeleted} contain the filter name.
                c('Info')
                    .jt`Please note that if you delete this filter ${nameDeleted} we will stop processing all the automated actions it triggers.`
            }
            <br />
            {c('Info').t`Are you sure you want to delete this filter?`}
        </Prompt>
    );
};

export default DeleteFilterModal;
