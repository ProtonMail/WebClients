import React from 'react';
import { SubTitle, PrimaryButton, useModals, Tooltip } from 'react-components';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';

import CalendarsTable from './CalendarsTable';
import CalendarModal from '../CalendarModal';

const notReady = true;

const CalendarsSection = ({ calendars }) => {
    const { createModal } = useModals();

    const handleCreate = () => {
        createModal(<CalendarModal />);
    };

    return (
        <>
            <SubTitle>{c('Title').t`Calendars`}</SubTitle>
            <div className="mb1">
                <Tooltip title={c('Info').t`Feature coming soon`}>
                    <PrimaryButton disabled={notReady} onClick={notReady ? noop : handleCreate}>{c('Action').t`Add calendar`}</PrimaryButton>
                </Tooltip>
            </div>
            <CalendarsTable calendars={calendars} />
        </>
    );
};

export default CalendarsSection;
