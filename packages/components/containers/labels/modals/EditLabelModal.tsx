import { useState } from 'react';
import * as React from 'react';
import { c } from 'ttag';

import { LABEL_COLORS, ROOT_FOLDER, LABEL_TYPE } from '@proton/shared/lib/constants';
import { randomIntFromInterval, noop } from '@proton/shared/lib/helpers/function';
import { create as createLabel, updateLabel, checkLabelAvailability } from '@proton/shared/lib/api/labels';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { omit } from '@proton/shared/lib/helpers/object';

import { FormModal } from '../../../components';
import { useEventManager, useLoading, useApi, useNotifications } from '../../../hooks';
import NewLabelForm from '../NewLabelForm';

interface ModalModel extends Pick<Folder | Label, 'Name' | 'Color' | 'Type'> {
    ID?: string;
    ParentID?: string | number;
    Notify?: number;
    Expanded?: number;
    Order?: number;
}

interface Props {
    type?: 'label' | 'folder';
    label?: ModalModel;
    mode?: 'create' | 'edition' | 'checkAvailable';
    onAdd?: (label: ModalModel) => void;
    onEdit?: (label: ModalModel) => void;
    onCheckAvailable?: (label: ModalModel) => void;
    onClose?: () => void;
}

const prepareLabel = (label: ModalModel) => {
    if (label.ParentID === ROOT_FOLDER) {
        return omit(label, ['ParentID']);
    }
    return label;
};

const EditLabelModal = ({
    label,
    mode = 'create',
    onAdd = noop,
    onEdit = noop,
    onCheckAvailable = noop,
    onClose = noop,
    type = 'label',
    ...props
}: Props) => {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const [model, setModel] = useState<ModalModel>(
        label || {
            Name: '',
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            Type: type === 'folder' ? LABEL_TYPE.MESSAGE_FOLDER : LABEL_TYPE.MESSAGE_LABEL,
            ParentID: type === 'folder' ? ROOT_FOLDER : undefined,
            Notify: type === 'folder' ? 1 : 0,
        }
    );

    const create = async (label: ModalModel) => {
        const { Label } = await api(createLabel(prepareLabel(label)));
        await call();
        createNotification({
            text: c('label/folder notification').t`${Label.Name} created`,
        });
        onAdd(Label);
        onClose();
    };

    const update = async (label: ModalModel) => {
        if (label.ID) {
            const { Label } = await api(updateLabel(label.ID, prepareLabel(label)));
            await call();
            createNotification({
                text: c('Filter notification').t`${Label.Name} updated`,
            });
            onEdit(Label);
        }
        onClose();
    };

    const checkIsAvailable = async (label: ModalModel) => {
        await api(checkLabelAvailability(label));
        onCheckAvailable(model);
        onClose();
    };

    const handleSubmit = async () => {
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

    const handleChangeName = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
        setModel({
            ...model,
            Name: target.value,
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
        <FormModal
            submit={c('Action').t`Save`}
            onSubmit={handleSubmit}
            loading={loading}
            title={getTitle()}
            onClose={onClose}
            {...props}
        >
            <NewLabelForm
                label={model}
                onChangeName={handleChangeName}
                onChangeColor={handleChangeColor}
                onChangeParentID={handleChangeParentID}
                onChangeNotify={handleChangeNotify}
            />
        </FormModal>
    );
};

export default EditLabelModal;
