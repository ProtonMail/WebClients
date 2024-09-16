import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import { deleteLabel } from '@proton/shared/lib/api/labels';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';

import type { ModalProps } from '../../../components';
import { ErrorButton } from '../../../components';

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

    const nameDeleted = (
        <strong className="text-ellipsis inline-block max-w-full align-bottom" title={label.Name}>
            {label.Name}
        </strong>
    );

    const I18N: { [key: number]: any } = {
        [LABEL_TYPE.MESSAGE_LABEL]: {
            // translator: ${nameDeleted} contain the label name.
            content: c('Info')
                .jt`Emails tagged with this label ${nameDeleted} will not be deleted and can still be found in the respective folder.`,
            confirm: c('Info').t`Are you sure you want to delete this label?`,
        },
        [LABEL_TYPE.MESSAGE_FOLDER]: {
            // translator: ${nameDeleted} contain the folder name.
            content: c('Info')
                .jt`Any subfolders will also be deleted. However, emails stored in this folder ${nameDeleted} will not be deleted and can be found in All Mail folder.`,
            confirm: c('Info').t`Are you sure you want to delete this folder?`,
        },
    };

    return (
        <Prompt
            title={
                label.Type === LABEL_TYPE.MESSAGE_FOLDER ? c('Title').t`Delete folder?` : c('Title').t`Delete label?`
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
        </Prompt>
    );
};

export default DeleteLabelModal;
