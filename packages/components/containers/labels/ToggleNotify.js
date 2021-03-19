import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { updateLabel } from 'proton-shared/lib/api/labels';
import { Tooltip, Toggle } from '../../components';
import { useApi, useLoading, useEventManager, useNotifications } from '../../hooks';

const ToggleNotify = ({ label }) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleChange = async ({ target }) => {
        const newLabel = {
            ...label,
            Notify: +target.checked,
        };
        await api(updateLabel(label.ID, newLabel));
        await call();
        createNotification({
            text: c('label/folder notification').t`${label.Name} updated`,
        });
    };
    return (
        <Tooltip title={c('Tooltip').t`Enable/disable desktop and mobile notifications`}>
            <span>
                <Toggle
                    id={`item-${label.ID}`}
                    checked={label.Notify === 1}
                    onChange={(e) => withLoading(handleChange(e))}
                    loading={loading}
                />
            </span>
        </Tooltip>
    );
};

ToggleNotify.propTypes = {
    label: PropTypes.object.isRequired,
};

export default ToggleNotify;
