import React from 'react';
import { Toggle, useToggle, useEventManager, useApiWithoutResult, useMailSettings } from 'react-components';
import { updateAutoresponder } from 'proton-shared/lib/api/mailSettings';

const AutoReplyToggle = ({ ...rest }) => {
    const [{ AutoResponder }] = useMailSettings();
    const { state, toggle } = useToggle(!!AutoResponder.IsEnabled);
    const { call } = useEventManager();
    const { request, loading } = useApiWithoutResult(updateAutoresponder);

    const handleToggle = async ({ target }) => {
        await request({ ...AutoResponder, IsEnabled: +target.checked });
        await call();
        toggle();
    };

    return <Toggle {...rest} loading={loading} checked={state} onChange={handleToggle} />;
};

export default AutoReplyToggle;
