import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { ModalProps } from '@proton/components';
import { ErrorButton, Prompt } from '@proton/components';

interface Props extends ModalProps {
    onResolve: () => void;
    onReject: () => void;
    isLabel: boolean;
}
const SelectAllDeleteModal = ({ onResolve, onReject, isLabel, ...rest }: Props) => {
    const handleClose = () => {
        onReject();
    };

    const handleSubmit = () => {
        onResolve();
        rest.onClose?.();
    };

    return (
        <Prompt
            title={c('Title').t`Delete all messages`}
            buttons={[
                <ErrorButton data-testid="confirm-empty-folder" onClick={handleSubmit}>
                    {c('Action').t`Delete`}
                </ErrorButton>,
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {isLabel ? (
                <>
                    {c('Info').t`All messages stored with this label will be permanently deleted.`}
                    <br />
                    {c('Info').t`Are you sure you want to delete all messages with this label?`}
                </>
            ) : (
                <>
                    {c('Info').t`All messages stored in this folder will be permanently deleted.`}
                    <br />
                    {c('Info').t`Are you sure you want to delete all messages in this folder?`}
                </>
            )}
        </Prompt>
    );
};

export default SelectAllDeleteModal;
