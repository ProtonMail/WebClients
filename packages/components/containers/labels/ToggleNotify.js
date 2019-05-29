import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Toggle, useToggle, useApiWithoutResult, useEventManager, useNotifications } from 'react-components';
import { updateLabel } from 'proton-shared/lib/api/labels';

const ToggleNotify = ({ label }) => {
    const { toggle, state } = useToggle(label.Notify === 1);
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(updateLabel);

    const handleChange = async ({ target }) => {
        const newLabel = {
            ...label,
            Notify: +target.checked
        };
        await request(label.ID, newLabel);
        await call();
        toggle();
        createNotification({
            text: c('label/folder notification').t`${label.Name} updated`
        });
    };
    return <Toggle id={`item-${label.ID}`} checked={state} onChange={handleChange} loading={loading} />;
};

ToggleNotify.propTypes = {
    label: PropTypes.object.isRequired
};

export default ToggleNotify;
