import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FormModal, useEventManager, useLoading, useApi, useNotifications } from 'react-components';
import { LABEL_EXCLUSIVE, LABEL_COLORS } from 'proton-shared/lib/constants';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { createLabel, updateLabel } from 'proton-shared/lib/api/labels';
import { noop } from 'proton-shared/lib/helpers/function';

import NewLabelForm from '../NewLabelForm';

function EditLabelModal({ label, mode = 'create', onEdit = noop, onAdd = noop, ...props }) {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const I18N = {
        edition({ Exclusive } = {}) {
            if (Exclusive === LABEL_EXCLUSIVE.LABEL) {
                return c('Label/folder modal').t`Edit label`;
            }
            return c('Label/folder modal').t`Edit folder`;
        },
        create(label, type) {
            if (type === 'label') {
                return c('Label/folder modal').t`Create a new label`;
            }
            return c('Label/folder modal').t`Create a new folder`;
        }
    };

    const [model, setModel] = useState(
        label || {
            Name: '',
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            Exclusive: +(props.type === 'folder')
        }
    );

    const create = async (label) => {
        const { Label } = await api(createLabel(label));
        await call();
        createNotification({
            text: c('label/folder notification').t`${Label.Name} created`
        });
        onAdd(Label);
        props.onClose();
    };

    const update = async (label) => {
        const { Label } = await api(updateLabel(label.ID, label));
        await call();
        createNotification({
            text: c('Filter notification').t`${Label.Name} updated`
        });
        onEdit(Label);
        props.onClose();
    };

    const ACTIONS = { create, edition: update };

    const handleSubmit = () => withLoading(ACTIONS[mode](model));

    const handleChangeColor = (Color) => {
        setModel({
            ...model,
            Color
        });
    };

    const handleChangeName = ({ target }) => {
        setModel({
            ...model,
            Name: target.value
        });
    };

    return (
        <FormModal onSubmit={handleSubmit} loading={loading} title={I18N[mode](label, props.type)} {...props}>
            <NewLabelForm label={model} onChangeName={handleChangeName} onChangeColor={handleChangeColor} />
        </FormModal>
    );
}

EditLabelModal.propTypes = {
    type: PropTypes.string,
    label: PropTypes.object,
    mode: PropTypes.string,
    onAdd: PropTypes.func,
    onEdit: PropTypes.func,
    onClose: PropTypes.func
};

export default EditLabelModal;
