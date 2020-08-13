import React from 'react';
import PropTypes from 'prop-types';
import { updateConfirmLink } from 'proton-shared/lib/api/mailSettings';
import { c } from 'ttag';
import { useToggle, useEventManager, useNotifications, useApi, useLoading } from '../../hooks';
import { Toggle } from '../../components';

const RequestLinkConfirmationToggle = ({ id, confirmLink }) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();
    const { state, toggle } = useToggle(!!confirmLink);

    const handleChange = async (checked) => {
        await api(updateConfirmLink(+checked));
        await call();
        toggle();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <Toggle
            id={id}
            checked={state}
            onChange={({ target }) => withLoading(handleChange(target.checked))}
            loading={loading}
        />
    );
};

RequestLinkConfirmationToggle.propTypes = {
    id: PropTypes.string,
    confirmLink: PropTypes.number,
};

export default RequestLinkConfirmationToggle;
