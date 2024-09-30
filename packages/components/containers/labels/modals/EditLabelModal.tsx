import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { useLoading } from '@proton/hooks';
import { checkLabelAvailability, create as createLabel, updateLabel } from '@proton/shared/lib/api/labels';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { LABEL_TYPE, ROOT_FOLDER } from '@proton/shared/lib/constants';
import { omit } from '@proton/shared/lib/helpers/object';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import noop from '@proton/utils/noop';

import { useApi, useEventManager, useNotifications } from '../../../hooks';
import NewLabelForm from '../NewLabelForm';

export interface LabelModel extends Pick<Folder | Label, 'Name' | 'Color' | 'Type'> {
    ID?: string;
    ParentID?: string | number;
    Notify?: number;
    Expanded?: number;
    Order?: number;
    Path?: string;
}

interface Props extends ModalProps {
    type?: 'label' | 'folder';
    label?: LabelModel;
    mode?: 'create' | 'edition' | 'checkAvailable';
    onAdd?: (label: LabelModel) => void;
    onEdit?: (label: LabelModel) => void;
    onCheckAvailable?: (label: LabelModel) => void;
    onCloseCustomAction?: () => void;
}

const prepareLabel = (label: LabelModel) => {
    if (label.ParentID === ROOT_FOLDER) {
        return omit(label, ['ParentID']);
    }
    return label;
};

const getDefaultLabel = (type: 'label' | 'folder') => ({
    Name: '',
    Color: getRandomAccentColor(),
    Type: type === 'folder' ? LABEL_TYPE.MESSAGE_FOLDER : LABEL_TYPE.MESSAGE_LABEL,
    ParentID: type === 'folder' ? ROOT_FOLDER : undefined,
    Notify: type === 'folder' ? 1 : 0,
});

const EditLabelModal = ({
    label,
    mode = 'create',
    onAdd = noop,
    onEdit = noop,
    onCheckAvailable = noop,
    type = 'label',
    onCloseCustomAction,
    ...rest
}: Props) => {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const { onClose } = rest;
    const [model, setModel] = useState<LabelModel>(label || getDefaultLabel(type));

    const handleClose = () => {
        onCloseCustomAction?.();
        onClose?.();
    };

    const create = async (label: LabelModel) => {
        const { Label } = await api(createLabel(prepareLabel(label)));
        await call();
        createNotification({
            text: c('label/folder notification').t`${Label.Name} created`,
        });
        onAdd(Label);
        handleClose();
    };

    const update = async (label: LabelModel) => {
        if (label.ID) {
            const { Label } = await api(updateLabel(label.ID, prepareLabel(label)));
            await call();
            createNotification({
                text: c('Filter notification').t`${Label.Name} updated`,
            });
            onEdit(Label);
        }
        handleClose();
    };

    const checkIsAvailable = async (label: LabelModel) => {
        await api(checkLabelAvailability(label));
        onCheckAvailable(model);
        handleClose();
    };

    const handleSubmit = async (e: FormEvent) => {
        e.stopPropagation();
        if (!onFormSubmit()) {
            return;
        }

        switch (mode) {
            case 'create':
                await withLoading(create(model));
                return;
            case 'edition':
                await withLoading(update(model));
                return;
            case 'checkAvailable':
                await withLoading(checkIsAvailable(model));
                return;
            default:
                return undefined;
        }
    };

    const handleChangeColor = (Color: string) => {
        setModel({
            ...model,
            Color,
        });
    };

    const handleChangeName = (value: string) => {
        setModel({
            ...model,
            Name: value,
        });
    };

    const handleChangeParentID = (ParentID: string | number) => {
        setModel({
            ...model,
            ParentID,
        });
    };

    const handleChangeNotify = (Notify: number) => {
        setModel({
            ...model,
            Notify,
        });
    };

    const getTitle = () => {
        const isFolder = model.Type === LABEL_TYPE.MESSAGE_FOLDER;
        if (mode === 'create') {
            return isFolder ? c('Label/folder modal').t`Create folder` : c('Label/folder modal').t`Create label`;
        }
        return isFolder ? c('Label/folder modal').t`Edit folder` : c('Label/folder modal').t`Edit label`;
    };

    return (
        <ModalTwo
            as={Form}
            onSubmit={handleSubmit}
            size="small"
            data-testid="label-modal"
            {...rest}
            onClose={handleClose}
        >
            <ModalTwoHeader title={getTitle()} />
            <ModalTwoContent>
                <NewLabelForm
                    label={model}
                    onChangeName={handleChangeName}
                    onChangeColor={handleChangeColor}
                    onChangeParentID={handleChangeParentID}
                    onChangeNotify={handleChangeNotify}
                    validator={validator}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button data-testid="label-modal:cancel" onClick={handleClose}>{c('Action').t`Cancel`}</Button>
                <Button data-testid="label-modal:save" color="norm" loading={loading} type="submit">{c('Action')
                    .t`Save`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default EditLabelModal;
