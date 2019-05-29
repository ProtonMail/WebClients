import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FormModal, useEventManager, useNotifications, useApiWithoutResult } from 'react-components';
import { LABEL_TYPES, LABEL_COLORS } from 'proton-shared/lib/constants';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { createLabel, updateLabel } from 'proton-shared/lib/api/labels';
import { noop } from 'proton-shared/lib/helpers/function';

import NewLabelForm from '../../../containers/labels/NewLabelForm';

function EditLabelModal({ label, mode, onEdit, onAdd, ...props }) {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const reqCreate = useApiWithoutResult(createLabel);
    const reqUpdate = useApiWithoutResult(updateLabel);

    const I18N = {
        edition({ Name, Exclusive } = {}) {
            if (Exclusive === LABEL_TYPES.LABEL) {
                return c('Label/folder modal').t`Edit label: ${Name}`;
            }
            return c('Label/folder modal').t`Edit folder: ${Name}`;
        },
        create({ Name } = {}, type) {
            if (type === 'label') {
                return c('Label/folder modal').t`Create a new label: ${Name}`;
            }
            return c('Label/folder modal').t`Create a new folder: ${Name}`;
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
        const { Label } = await reqCreate.request(label);
        await call();
        createNotification({
            text: c('label/folder notification').t`${Label.Name} created`
        });
        onAdd(Label);
        props.onClose();
    };

    const update = async (label) => {
        const { Label } = await reqUpdate.request(label.ID, label);
        await call();
        createNotification({
            text: c('Filter notification').t`${Label.Name} updated`
        });
        onEdit(Label);
        props.onClose();
    };

    const ACTIONS = { create, edition: update };

    const handleSubmit = () => ACTIONS[mode](model);
    const handleChangeColor = (Color) => () => {
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
        <FormModal
            onSubmit={handleSubmit}
            loading={reqCreate.loading || reqUpdate.loading}
            title={I18N[mode](label, props.type)}
            {...props}
        >
            <NewLabelForm label={model} onChangeName={handleChangeName} onChangeColor={handleChangeColor} />
        </FormModal>
    );
}

EditLabelModal.propTypes = {
    type: PropTypes.string,
    label: PropTypes.object,
    mode: PropTypes.string,
    onAdd: PropTypes.func,
    onEdit: PropTypes.func
};

EditLabelModal.defaultProps = {
    onAdd: noop,
    onEdit: noop,
    mode: 'create'
};

export default EditLabelModal;
