import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { Bordered, FileInput, Alert, Label, Field, Select, classnames } from 'react-components';

import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { ImportCalendarModel } from '../../interfaces/Import';

import AttachedFile from './AttachedFile';
import { MAX_IMPORT_EVENTS_STRING, MAX_IMPORT_FILE_SIZE_STRING } from '../../constants';

interface Props {
    model: ImportCalendarModel;
    calendars: Calendar[];
    onSelectCalendar: (calendar: Calendar) => void;
    onAttach: (event: ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
}

const AttachingModalContent = ({ model, calendars, onSelectCalendar, onAttach, onClear }: Props) => {
    const options = calendars.map(({ Name, ID }) => ({ text: Name, value: ID }));
    const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) => {
        const calendar = calendars.find(({ ID }) => ID === target.value);
        if (calendar) {
            onSelectCalendar(calendar);
        }
    };

    const alert = model.failure ? (
        <Alert type="error">{model.failure?.message}</Alert>
    ) : (
        <Alert type="info" learnMore="TODO_URL">
            {c('Description').t`You can import events in iCal format (.ics file).
                The file should have a maximum size of ${MAX_IMPORT_FILE_SIZE_STRING} and have up to ${MAX_IMPORT_EVENTS_STRING} events.
                If your file is bigger, please split it into smaller files.`}
        </Alert>
    );

    return (
        <>
            {alert}
            <Bordered className={classnames(['flex', !!model.failure && 'bordered-container--error'])}>
                {model.fileAttached ? (
                    <AttachedFile file={model.fileAttached} iconName="calendar" onClear={onClear} />
                ) : (
                    <FileInput className="center" accept=".ics" id="import-calendar" onChange={onAttach}>
                        {c('Action').t`Select file from computer`}
                    </FileInput>
                )}
            </Bordered>
            {calendars.length > 1 && (
                <div className="flex-nowrap mb1 onmobile-flex-column">
                    <Label className="mr1" htmlFor="import-calendar-select">{c('Label').t`Import to:`}</Label>
                    <Field>
                        <Select
                            id="import-calendar-select"
                            loading={false}
                            onChange={handleChange}
                            value={model.calendar.ID}
                            options={options}
                        />
                    </Field>
                </div>
            )}
        </>
    );
};

export default AttachingModalContent;
