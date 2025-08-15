import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { deleteLabel } from '@proton/mail/store/labels/actions';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';

interface Props extends ModalProps {
    label: Label;
    onRemove?: () => void;
}

const DeleteLabelModal = ({ label, onRemove, ...rest }: Props) => {
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const { onClose } = rest;

    const [loading, withLoading] = useLoading();

    const handleRemove = async () => {
        await dispatch(deleteLabel({ label }));
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
                .jt`Emails tagged with the label ${nameDeleted} will not be deleted and can still be found in the respective folder.`,
            confirm: c('Info').t`Are you sure you want to delete this label?`,
        },
        [LABEL_TYPE.MESSAGE_FOLDER]: {
            // translator: ${nameDeleted} contain the folder name.
            content: c('Info')
                .jt`Any subfolders will also be deleted. However, emails stored in the folder ${nameDeleted} will not be deleted and can be found in All Mail folder.`,
            confirm: c('Info').t`Are you sure you want to delete this folder?`,
        },
    };

    const loadingButtonCopy =
        label.Type === LABEL_TYPE.MESSAGE_FOLDER ? c('Action').t`Deleting folder` : c('Action').t`Deleting label`;

    return (
        <Prompt
            title={
                label.Type === LABEL_TYPE.MESSAGE_FOLDER ? c('Title').t`Delete folder?` : c('Title').t`Delete label?`
            }
            buttons={[
                <Button
                    color="danger"
                    loading={loading}
                    onClick={async () => {
                        await withLoading(handleRemove);
                    }}
                >
                    {loading ? loadingButtonCopy : c('Action').t`Delete`}
                </Button>,
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
