import React from 'react';
import PropTypes from 'prop-types';
import {
    Toggle,
    useApi,
    useEventManager,
    useToggle,
    useMailSettings,
    useNotifications,
    useLoading,
} from 'react-components';
import { updateShowMoved } from 'proton-shared/lib/api/mailSettings';
import { SHOW_MOVED } from 'proton-shared/lib/constants';
import { c } from 'ttag';

const { DRAFTS_AND_SENT, NONE } = SHOW_MOVED;

const ShowMovedToggle = ({ id }) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [{ ShowMoved } = {}] = useMailSettings();
    const { call } = useEventManager();
    const { state, toggle } = useToggle(!!ShowMoved);

    const handleChange = async (checked) => {
        await api(updateShowMoved(checked ? DRAFTS_AND_SENT : NONE));
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

ShowMovedToggle.propTypes = {
    id: PropTypes.string,
};

export default ShowMovedToggle;
