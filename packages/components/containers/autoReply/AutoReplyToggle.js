import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Toggle, useToggle, useEventManager, useApiWithoutResult } from 'react-components';
import { updateAutoresponder } from 'proton-shared/lib/api/mailSettings';

const AutoReplyToggle = ({ autoresponder: AutoResponder, ...rest }) => {
    const { state, toggle } = useToggle(!!AutoResponder.IsEnabled);
    const { call } = useEventManager();
    const { request } = useApiWithoutResult(updateAutoresponder);
    const [loading, setLoading] = useState(false);

    const handleToggle = async ({ target }) => {
        try {
            setLoading(true);
            await request({ ...AutoResponder, IsEnabled: target.checked });
            await call();
            setLoading(false);
            toggle();
        } catch (error) {
            setLoading(false);
        }
    };

    return <Toggle {...rest} loading={loading} checked={state} onChange={handleToggle} />;
};

AutoReplyToggle.propTypes = {
    autoresponder: PropTypes.object
};

export default AutoReplyToggle;
