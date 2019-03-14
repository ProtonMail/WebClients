import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Toggle, useApiWithoutResult, useEventManager } from 'react-components';
import { updateSign } from 'proton-shared/lib/api/mailSettings';

const SignToggle = ({ id, sign }) => {
    const { call } = useEventManager();
    const { request, loading } = useApiWithoutResult(updateSign);
    const [value, setValue] = useState(!!sign);
    const handleChange = async (newValue) => {
        await request(+newValue);
        await call();
        setValue(newValue);
    };
    return <Toggle id={id} value={value} onChange={handleChange} disabled={loading} />;
};

SignToggle.propTypes = {
    id: PropTypes.string,
    sign: PropTypes.number.isRequired
};

export default SignToggle;
