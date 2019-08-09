import React from 'react';
import { SubTitle, PrimaryButton, useModals } from 'react-components';
import { c } from 'ttag';

import CalendarsTable from './CalendarsTable';
import CalendarModal from '../modals/CalendarModal';

const CalendarsSection = () => {
    const { createModal } = useModals();
    const handleCreate = () => createModal(<CalendarModal />);

    return (
        <>
            <SubTitle>{c('Title').t`Calendars`}</SubTitle>
            <div className="mb1">
                <PrimaryButton onClick={handleCreate}>{c('Action').t`Add calendar`}</PrimaryButton>
            </div>
            <CalendarsTable />
        </>
    );
};

export default CalendarsSection;
