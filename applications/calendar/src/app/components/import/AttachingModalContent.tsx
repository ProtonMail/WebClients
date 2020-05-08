import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { Bordered, FileInput, Alert, Label, Field, Select, classnames } from 'react-components';

import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { MAX_IMPORT_EVENTS_STRING, MAX_IMPORT_FILE_SIZE_STRING } from '../../constants';
import { IMPORT_ERROR_TYPE, ImportCalendarModel, ImportFailure } from '../../interfaces/Import';

import AttachedFile from './AttachedFile';

interface Props {
    model: ImportCalendarModel;
    calendars: Calendar[];
    onSelectCalendar: (calendar: Calendar) => void;
    onAttach: (event: ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
}

const getAlertMessage = (failure?: ImportFailure) => {
    const failureType = failure?.type;
    if (failureType === IMPORT_ERROR_TYPE.NO_FILE_SELECTED) {
        return c('Error importing calendar').t`An error occurred uploading your file. No file has been selected.`;
    }
    if (failureType === IMPORT_ERROR_TYPE.NO_ICS_FILE) {
        return c('Error importing calendar')
            .t`An error occurred uploading your file. Only .ics file formats are allowed.`;
    }
    if (failureType === IMPORT_ERROR_TYPE.FILE_EMPTY) {
        return c('Error importing calendar').t`ICS file is empty.`;
    }
    if (failureType === IMPORT_ERROR_TYPE.FILE_TOO_BIG) {
        return c('Error importing calendar')
            .t`An error occurred uploading your file. Maximum file size is ${MAX_IMPORT_FILE_SIZE_STRING}.`;
    }
    if (failureType === IMPORT_ERROR_TYPE.INVALID_CALENDAR) {
        return c('Error importing calendar').t`ICS file is not a calendar.`;
    }
    if (failureType === IMPORT_ERROR_TYPE.NO_EVENTS) {
        return c('Error importing calendar').t`No events to be imported.`;
    }
    if (failureType === IMPORT_ERROR_TYPE.TOO_MANY_EVENTS) {
        return c('Error importing calendar').t`ICS file contains more than ${MAX_IMPORT_EVENTS_STRING} events.`;
    }
    if (failureType === IMPORT_ERROR_TYPE.FILE_CORRUPTED) {
        return c('Error importing calendar')
            .t`An error occurred reading your file. File doesn't have the right format.`;
    }
    if (failureType === IMPORT_ERROR_TYPE.UNEXPECTED_ERROR) {
        return c('Error importing calendar').t`An unexpected error occurred. Import must be restarted.`;
    }
    return c('Description').t`You can import events in iCal format (.ics file).
        The file should have a maximum size of ${MAX_IMPORT_FILE_SIZE_STRING} and have up to ${MAX_IMPORT_EVENTS_STRING} events.
        If your file is bigger, please split it into smaller files.`;
};

const AttachingModalContent = ({ model, calendars, onSelectCalendar, onAttach, onClear }: Props) => {
    const options = calendars.map(({ Name, ID }) => ({ text: Name, value: ID }));
    const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) => {
        const calendar = calendars.find(({ ID }) => ID === target.value);
        calendar && onSelectCalendar(calendar);
    };
    const learnMore = model.failure ? '' : 'TODO_URL';
    const alertType = model.failure ? 'error' : 'info';
    return (
        <>
            <Alert type={alertType} learnMore={learnMore}>
                {getAlertMessage(model.failure)}
            </Alert>
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
