import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FormModal, useNotifications, useApiWithoutResult } from 'react-components';
import { addIncomingDefault } from 'proton-shared/lib/api/incomingDefaults';
import { noop } from 'proton-shared/lib/helpers/function';
import { MAILBOX_IDENTIFIERS } from 'proton-shared/lib/constants';

import AddEmailToList from '../../containers/filters/spamlist/AddEmailToList';

const BLACKLIST_TYPE = +MAILBOX_IDENTIFIERS.spam;
const WHITELIST_TYPE = +MAILBOX_IDENTIFIERS.inbox;

function AddEmailToListModal({ type, onAdd, onClose, ...rest }) {
    const I18N = {
        blacklist: c('Title').t`Add to Blacklist`,
        whitelist: c('Title').t`Add to Whitelist`
    };

    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(addIncomingDefault);
    const [email, setEmail] = useState('');

    const handleChange = setEmail;
    const handleSubmit = async () => {
        const Location = type === 'whitelist' ? WHITELIST_TYPE : BLACKLIST_TYPE;
        const { IncomingDefault: data } = await request({ Location, Email: email });
        createNotification({
            text: c('Spam notification').t`${email} added to ${I18N[type]}`
        });
        onAdd(type, data);
        onClose();
    };

    return (
        <FormModal
            onSubmit={handleSubmit}
            loading={loading}
            title={I18N[type]}
            submit={c('Action').t`Save`}
            onClose={onClose}
            {...rest}
        >
            <AddEmailToList onChange={handleChange} />
        </FormModal>
    );
}

AddEmailToListModal.propTypes = {
    type: PropTypes.oneOf(['blacklist', 'whitelist']).isRequired,
    onAdd: PropTypes.func.isRequired
};

AddEmailToListModal.defaultProps = {
    onAdd: noop
};

export default AddEmailToListModal;
