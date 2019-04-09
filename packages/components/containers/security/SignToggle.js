import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useApiWithoutResult, useEventManager, useToggle } from 'react-components';
import { updateSign } from 'proton-shared/lib/api/mailSettings';

const SignToggle = ({ id, sign }) => {
    const { call } = useEventManager();
    const { request, loading } = useApiWithoutResult(updateSign);
    const { state, toggle } = useToggle(!!sign);
    const handleChange = async ({ target }) => {
        await request(+target.checked);
        await call();
        toggle();
    };
    return <Toggle id={id} checked={state} onChange={handleChange} disabled={loading} />;
};

SignToggle.propTypes = {
    id: PropTypes.string,
    sign: PropTypes.number.isRequired
};

export default SignToggle;
