import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useApiWithoutResult, useEventManager, useToggle, useMailSettings } from 'react-components';
import { updateShowMoved } from 'proton-shared/lib/api/mailSettings';
import { SHOW_MOVED } from 'proton-shared/lib/constants';

const { DRAFTS_AND_SENT, NONE } = SHOW_MOVED;

const ShowMovedToggle = ({ id }) => {
    const [{ ShowMoved } = {}] = useMailSettings();
    const { call } = useEventManager();
    const { request, loading } = useApiWithoutResult(updateShowMoved);
    const { state, toggle } = useToggle(!!ShowMoved);

    const handleChange = async ({ target }) => {
        await request(target.checked ? DRAFTS_AND_SENT : NONE);
        call();
        toggle();
    };

    return <Toggle id={id} checked={state} onChange={handleChange} loading={loading} />;
};

ShowMovedToggle.propTypes = {
    id: PropTypes.string
};

export default ShowMovedToggle;
