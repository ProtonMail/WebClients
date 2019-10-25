import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Toggle, useNotifications, useEventManager, useApi, useLoading } from 'react-components';
import { updateAutoSaveContacts } from 'proton-shared/lib/api/mailSettings';

const AutoSaveContactsToggle = ({ autoSaveContacts, ...rest }) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();

    const handleChange = async ({ target }) => {
        await api(updateAutoSaveContacts(+target.checked));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <Toggle
            loading={loading}
            checked={autoSaveContacts}
            onChange={(event) => withLoading(handleChange(event))}
            {...rest}
        />
    );
};

AutoSaveContactsToggle.propTypes = {
    autoSaveContacts: PropTypes.bool
};

export default AutoSaveContactsToggle;
