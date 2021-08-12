import { c } from 'ttag';
import { ChangeEvent, DragEvent } from 'react';

import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import {
    IMPORT_CALENDAR_FAQ_URL,
    MAX_IMPORT_EVENTS_STRING,
    MAX_IMPORT_FILE_SIZE_STRING,
} from '@proton/shared/lib/calendar/constants';
import { ImportCalendarModel } from '@proton/shared/lib/interfaces/calendar/Import';

import { Bordered, FileInput, Alert, Label, Field, AttachedFile, Dropzone } from '../../../components';
import CalendarSelect from '../../../components/calendarSelect/CalendarSelect';
import { classnames } from '../../../helpers';

interface Props {
    model: ImportCalendarModel;
    calendars: Calendar[];
    onSelectCalendar: (calendar: Calendar) => void;
    onAttach: (event: ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
    isDropzoneHovered: boolean;
    onDrop: (event: DragEvent) => void;
    onDragEnter: (event: DragEvent) => void;
    onDragLeave: (event: DragEvent) => void;
}

const AttachingModalContent = ({
    model,
    calendars,
    onSelectCalendar,
    onAttach,
    onClear,
    isDropzoneHovered,
    onDrop,
    onDragEnter,
    onDragLeave,
}: Props) => {
    const options = calendars.map(({ Name, ID, Color }) => ({ name: Name, id: ID, color: Color }));
    const handleChange = ({ value }: { value: string }) => {
        const calendar = calendars.find(({ ID }) => ID === value);

        if (calendar) {
            onSelectCalendar(calendar);
        }
    };

    const alert = model.failure ? (
        <Alert type="error">{model.failure?.message}</Alert>
    ) : (
        <Alert type="info" learnMore={IMPORT_CALENDAR_FAQ_URL}>
            {c('Description')
                .t`You can import events in iCal format (ICS file). The file should have a maximum size of ${MAX_IMPORT_FILE_SIZE_STRING} and have up to ${MAX_IMPORT_EVENTS_STRING} events. If your file is bigger, please split it into smaller files.`}
        </Alert>
    );

    return (
        <>
            {alert}
            <Bordered className={classnames(['flex relative', !!model.failure && 'bordered-container--error'])}>
                {model.fileAttached ? (
                    <AttachedFile file={model.fileAttached} iconName="calendar" onClear={onClear} />
                ) : (
                    <Dropzone
                        isHovered={isDropzoneHovered}
                        onDrop={onDrop}
                        onDragEnter={onDragEnter}
                        onDragLeave={onDragLeave}
                        className="w100"
                    >
                        <FileInput className="center" accept=".ics" id="import-calendar" onChange={onAttach}>
                            {c('Action').t`Choose a file or drag it here`}
                        </FileInput>
                    </Dropzone>
                )}
            </Bordered>
            {calendars.length > 1 && (
                <div className="flex-nowrap mb1 onmobile-flex-column">
                    <Label className="pt0 mr1" htmlFor="import-calendar-select">{c('Label').t`Import to:`}</Label>
                    <Field>
                        <CalendarSelect
                            id="import-calendar-select"
                            calendarID={model.calendar.ID}
                            options={options}
                            onChange={handleChange}
                        />
                    </Field>
                </div>
            )}
        </>
    );
};

export default AttachingModalContent;
