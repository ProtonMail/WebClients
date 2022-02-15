import { c } from 'ttag';
import { Label } from '@proton/shared/lib/interfaces';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import { Alert, AlertModal, Button, ErrorButton, ModalProps } from '../../../components';

interface Props extends ModalProps {
    label: Label;
    onRemove: () => void;
}

const DeleteLabelModal = ({ label, onRemove, ...rest }: Props) => {
    const { onClose } = rest;

    const I18N: { [key: number]: any } = {
        [LABEL_TYPE.MESSAGE_LABEL]: {
            content: c('Info')
                .t`Emails tagged with this label will not be deleted and can still be found in the respective folder.`,
            confirm: c('Info').t`Are you sure you want to delete this label?`,
        },
        [LABEL_TYPE.MESSAGE_FOLDER]: {
            content: c('Info')
                .t`Emails stored in this folder will not be deleted and can still be found in the All Mail folder.`,
            confirm: c('Info')
                .t`Are you sure you want to delete this folder? All children folders will also be deleted.`,
        },
    };

    return (
        <AlertModal
            title={
                label.Type === LABEL_TYPE.MESSAGE_FOLDER
                    ? c('Title').t`Delete ${label.Name} folder`
                    : c('Title').t`Delete ${label.Name} label`
            }
            buttons={[
                <ErrorButton onClick={onRemove}>{c('Action').t`Delete`}</ErrorButton>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <Alert className="mb1" type="info">
                {I18N[label.Type].content}
            </Alert>
            <Alert className="mb1" type="error">
                {I18N[label.Type].confirm}
            </Alert>
        </AlertModal>
    );
};

export default DeleteLabelModal;
