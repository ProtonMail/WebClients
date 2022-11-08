import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import { deleteLabel } from '@proton/shared/lib/api/labels';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import { Label } from '@proton/shared/lib/interfaces';

import { AlertModal, ErrorButton, ModalProps } from '../../../components';

interface Props extends ModalProps {
    label: Label;
    onRemove?: () => void;
}

const DeleteLabelModal = ({ label, onRemove, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { onClose } = rest;

    const handleRemove = async () => {
        await api(deleteLabel(label.ID));
        await call();
        createNotification({
            text: c('Success notification').t`${label.Name} removed`,
        });

        onRemove?.();
    };

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
                <ErrorButton onClick={handleRemove}>{c('Action').t`Delete`}</ErrorButton>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {I18N[label.Type].content}
            <br />
            <br />
            {I18N[label.Type].confirm}
        </AlertModal>
    );
};

export default DeleteLabelModal;
