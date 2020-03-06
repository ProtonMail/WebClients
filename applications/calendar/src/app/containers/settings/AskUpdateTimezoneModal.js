import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Button, useApi, useEventManager, useNotifications, FormModal, useLoading } from 'react-components';
import { updateCalendarUserSettings } from 'proton-shared/lib/api/calendars';

const AskUpdateTimezoneModal = ({ localTzid, onClose, ...rest }) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const handleUpdateTimezone = async (tzid) => {
        await api(updateCalendarUserSettings({ PrimaryTimezone: tzid }));
        await call();
        onClose();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const timezone = <b key={0}>{localTzid}</b>;

    const handleClose = () => {
        onClose();
    };

    return (
        <FormModal
            onClose={handleClose}
            onSubmit={() => withLoading(handleUpdateTimezone(localTzid))}
            title={c('Modal title').t`Time zone changed`}
            close={<Button onClick={handleClose} autoFocus={true}>{c('Action').t`Cancel`}</Button>}
            submit={c('Action').t`Update`}
            small
            loading={loading}
            hasClose={false}
            {...rest}
        >
            {c('')
                .jt`Your system time zone seems to have changed to ${timezone}. Do you want to update your time zone preference?`}
        </FormModal>
    );
};

AskUpdateTimezoneModal.propTypes = {
    localTzid: PropTypes.string,
    onCancel: PropTypes.func,
    onClose: PropTypes.func
};

export default AskUpdateTimezoneModal;
