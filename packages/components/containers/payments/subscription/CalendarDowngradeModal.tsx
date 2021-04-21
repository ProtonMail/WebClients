import React from 'react';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { FormModal, AppLink, Alert } from '../../../components';

interface Props {
    onClose: () => void;
    onSubmit: () => void;
}

const CALENDAR_APP_NAME = getAppName(APPS.PROTONCALENDAR);

const CalendarDowngradeModal = ({ onSubmit, onClose, ...rest }: Props) => {
    const handleSubmit = () => {
        onSubmit();
        onClose();
    };

    const linkButton = (
        <AppLink toApp={APPS.PROTONACCOUNT} to="/calendar/calendars" onClick={onClose}>
            {c('Action').t`Open ${CALENDAR_APP_NAME} settings`}
        </AppLink>
    );

    return (
        <FormModal
            title={c('Title').t`Cancel subscription`}
            submit={c('Action').t`OK`}
            onSubmit={handleSubmit}
            onClose={onClose}
            close={null}
            {...rest}
        >
            <Alert type="warning">
                {c('Info')
                    .jt`You must remove any additional calendar before you can cancel your subscription. Any shared calendar links you created previously will no longer work. ${linkButton}`}
            </Alert>
        </FormModal>
    );
};

export default CalendarDowngradeModal;
