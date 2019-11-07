import React from 'react';
import { SubTitle, PrimaryButton, useModals, Tooltip } from 'react-components';
import { c } from 'ttag';

import CalendarsTable from './CalendarsTable';
import CalendarModal from '../CalendarModal';

const CalendarsSection = () => {
    const { createModal } = useModals();
    const notReady = true;
    const handleCreate = () => {
        if (notReady) {
            return;
        }
        createModal(<CalendarModal />);
    };

    return (
        <>
            <SubTitle>{c('Title').t`Calendars`}</SubTitle>
            <div className="mb1">
                <Tooltip title={c('Info').t`Feature coming soon`}>
                    <PrimaryButton disabled={true} onClick={handleCreate}>{c('Action').t`Add calendar`}</PrimaryButton>
                </Tooltip>
            </div>
            <CalendarsTable />
        </>
    );
};

export default CalendarsSection;
