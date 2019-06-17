import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Toggle, useToggle, useNotifications, useEventManager, useApiWithoutResult } from 'react-components';
import { updateAutoSaveContacts } from 'proton-shared/lib/api/mailSettings';

const AutoSaveContactsToggle = ({ autoSaveContacts, ...rest }) => {
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const { request, loading } = useApiWithoutResult(updateAutoSaveContacts);
    const { state, toggle } = useToggle(!!autoSaveContacts);

    const handleChange = async ({ target }) => {
        await request(+target.checked);
        call();
        toggle();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return <Toggle loading={loading} checked={state} onChange={handleChange} {...rest} />;
};

AutoSaveContactsToggle.propTypes = {
    autoSaveContacts: PropTypes.bool
};

export default AutoSaveContactsToggle;
