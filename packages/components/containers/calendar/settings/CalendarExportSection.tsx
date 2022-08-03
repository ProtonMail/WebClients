import { useState } from 'react';

import { c } from 'ttag';

import CalendarSelect from '@proton/components/components/calendarSelect/CalendarSelect';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { ExportModal } from '@proton/components/containers/calendar/exportModal';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { Alert, Href, PrimaryButton, useModalState } from '../../../components';
import { SettingsParagraph, SettingsSection } from '../../account';

interface Props {
    fallbackCalendar?: VisualCalendar;
    personalCalendars: VisualCalendar[];
}

const CalendarExportSection = ({ personalCalendars, fallbackCalendar }: Props) => {
    const [calendar, setCalendar] = useState(fallbackCalendar);
    const [exportModal, setIsExportModalOpen, renderExportModal] = useModalState();

    const calendarOptions = personalCalendars.map(({ ID: id, Name: name, Color: color }) => ({ id, name, color }));

    const handleSelectCalendar = ({ value: id }: SelectChangeEvent<string>) => {
        const selectedCalendar = personalCalendars.find(({ ID }) => ID === id);
        setCalendar(selectedCalendar || fallbackCalendar);
    };

    const handleExport = () => {
        setIsExportModalOpen(true);
    };

    const selectedCalendar = calendar || fallbackCalendar;

    return (
        <SettingsSection>
            {renderExportModal && selectedCalendar && (
                <ExportModal isOpen={exportModal.open} calendar={selectedCalendar} {...exportModal} />
            )}

            {!selectedCalendar && (
                <Alert className="mb1" type="warning">
                    {c('Info').t`You have no personal calendars to export.`}
                </Alert>
            )}

            <SettingsParagraph>
                {c('Calendar export section description')
                    .t`Download an ICS file with all the events from the selected calendar.`}
                <br />
                <Href url={getKnowledgeBaseUrl('/protoncalendar-calendars')}>{c('Knowledge base link label')
                    .t`Here's how`}</Href>
            </SettingsParagraph>

            <div className="flex">
                {selectedCalendar && (
                    <span className="flex-item-fluid mr1">
                        <CalendarSelect
                            calendarID={selectedCalendar.ID}
                            options={calendarOptions}
                            onChange={handleSelectCalendar}
                            freeze={false}
                        />
                    </span>
                )}
                <span className="flex-item-noshrink">
                    <PrimaryButton onClick={handleExport} disabled={!selectedCalendar}>{c('Action')
                        .t`Download ICS`}</PrimaryButton>
                </span>
            </div>
        </SettingsSection>
    );
};

export default CalendarExportSection;
