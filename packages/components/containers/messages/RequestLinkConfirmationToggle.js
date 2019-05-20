import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useToggle, useApiWithoutResult, useEventManager } from 'react-components';
import { updateConfirmLink } from 'proton-shared/lib/api/mailSettings';

const RequestLinkConfirmationToggle = ({ id, confirmLink }) => {
    const { call } = useEventManager();
    const { request, loading } = useApiWithoutResult(updateConfirmLink);
    const { state, toggle } = useToggle(!!confirmLink);

    const handleChange = async ({ target }) => {
        await request(+target.checked);
        call();
        toggle();
    };

    return <Toggle id={id} checked={state} onChange={handleChange} loading={loading} />;
};

RequestLinkConfirmationToggle.propTypes = {
    id: PropTypes.string,
    confirmLink: PropTypes.number
};

export default RequestLinkConfirmationToggle;
