import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useApiWithoutResult, useEventManager, useToggle, useMailSettings } from 'react-components';
import { updateShowMoved } from 'proton-shared/lib/api/mailSettings';

const ShowMovedToggle = ({ id }) => {
    const [{ ShowMoved } = {}] = useMailSettings();
    const { call } = useEventManager();
    const { request, loading } = useApiWithoutResult(updateShowMoved);
    const { state, toggle } = useToggle(!!ShowMoved);

    const handleChange = async ({ target }) => {
        await request(target.checked ? 3 : 0);
        call();
        toggle();
    };

    return <Toggle id={id} checked={state} onChange={handleChange} loading={loading} />;
};

ShowMovedToggle.propTypes = {
    id: PropTypes.string
};

export default ShowMovedToggle;
