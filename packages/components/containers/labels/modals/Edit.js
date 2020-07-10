import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FormModal, useEventManager, useLoading, useApi, useNotifications } from 'react-components';
import { LABEL_COLORS, ROOT_FOLDER, LABEL_TYPE } from 'proton-shared/lib/constants';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { create as createLabel, updateLabel } from 'proton-shared/lib/api/labels';

import NewLabelForm from '../NewLabelForm';

/**
 * @type any
 * @param {any} options
 */
function EditLabelModal({ label = null, mode = 'create', onEdit, onClose, onAdd, type = 'label', ...props }) {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const I18N = {
        edition({ Type } = {}) {
            if (Type === LABEL_TYPE.MESSAGE_LABEL) {
                return c('Label/folder modal').t`Edit label`;
            }
            return c('Label/folder modal').t`Edit folder`;
        },
        create({ Type } = {}) {
            if (Type === LABEL_TYPE.MESSAGE_LABEL) {
                return c('Label/folder modal').t`Create label`;
            }
            return c('Label/folder modal').t`Create folder`;
        }
    };

    const [model, setModel] = useState(
        label || {
            Name: '',
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            Type: type === 'folder' ? LABEL_TYPE.MESSAGE_FOLDER : LABEL_TYPE.MESSAGE_LABEL,
            ParentID: type === 'folder' ? ROOT_FOLDER : undefined
        }
    );

    const create = async (label) => {
        const { Label } = await api(createLabel(label));
        await call();
        createNotification({
            text: c('label/folder notification').t`${Label.Name} created`
        });
        onAdd?.(Label);
        onClose?.();
    };

    const update = async (label) => {
        const { Label } = await api(updateLabel(label.ID, label));
        await call();
        createNotification({
            text: c('Filter notification').t`${Label.Name} updated`
        });
        onEdit?.(Label);
        onClose?.();
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

    const handleChangeParentID = (ParentID) => {
        setModel({
            ...model,
            ParentID
        });
    };

    return (
        <FormModal
            submit={c('Action').t`Save`}
            onSubmit={handleSubmit}
            loading={loading}
            title={I18N[mode](model)}
            onClose={onClose}
            {...props}
        >
            <NewLabelForm
                label={model}
                onChangeName={handleChangeName}
                onChangeColor={handleChangeColor}
                onChangeParentID={handleChangeParentID}
            />
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
