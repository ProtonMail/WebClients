import { ChangeEvent } from 'react';



import { c } from 'ttag';

import {
    IMPORT_CALENDAR_FAQ_URL,
    MAX_IMPORT_EVENTS_STRING,
    MAX_IMPORT_FILE_SIZE_STRING,
} from '@proton/shared/lib/calendar/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { ImportCalendarModel } from '@proton/shared/lib/interfaces/calendar/Import';
import clsx from '@proton/utils/clsx';

import { Alert, AttachedFile, Dropzone, Field, FileInput, Label, LearnMore, Row } from '../../../components';
import CalendarSelect from '../../../components/calendarSelect/CalendarSelect';

interface Props {
    model: ImportCalendarModel;
    calendars: VisualCalendar[];
    onSelectCalendar: (calendar: VisualCalendar) => void;
    onAttach: (event: ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
    onDrop: (Files: File[]) => void;
}

const AttachingModalContent = ({ model, calendars, onSelectCalendar, onAttach, onClear, onDrop }: Props) => {
    const options = calendars.map(({ Name, ID, Color }) => ({ name: Name, id: ID, color: Color }));
    const handleChange = ({ value }: { value: string }) => {
        const calendar = calendars.find(({ ID }) => ID === value);

        if (calendar) {
            onSelectCalendar(calendar);
        }
    };

    const alert = model.failure ? (
        <Alert className="mb-4" type="error">
            {model.failure?.message}
        </Alert>
    ) : (
        <div className="mb-4">
            {c('Description')
                .t`You can import events in iCal format (ICS file). The file should have a maximum size of ${MAX_IMPORT_FILE_SIZE_STRING} and have up to ${MAX_IMPORT_EVENTS_STRING} events. If your file is bigger, please split it into smaller files.`}
            <div>
                <LearnMore url={getKnowledgeBaseUrl(IMPORT_CALENDAR_FAQ_URL)} />
            </div>
        </div>
    );

    return (
        <>
            {alert}
            <Dropzone onDrop={onDrop} size="small" shape="flashy">
                <div
                    className={clsx([
                        'flex w100 h100 flex-align-items-center flex-justify-center border p1',
                        !!model.failure && 'border-danger',
                    ])}
                >
                    {model.fileAttached ? (
                        <AttachedFile
                            file={model.fileAttached}
                            iconName="calendar-grid"
                            clear={c('Action').t`Delete`}
                            onClear={onClear}
                        />
                    ) : (
                        <FileInput className="mx-auto" accept=".ics" id="import-calendar" onChange={onAttach}>
                            {c('Action').t`Choose a file or drag it here`}
                        </FileInput>
                    )}
                </div>
            </Dropzone>
            {calendars.length > 1 && (
                <Row>
                    <Label style={{ '--label-width': 'auto' }} htmlFor="import-calendar-select">
                        {c('Label').t`Import to:`}
                    </Label>
                    <Field>
                        <CalendarSelect
                            id="import-calendar-select"
                            calendarID={model.calendar.ID}
                            options={options}
                            onChange={handleChange}
                        />
                    </Field>
                </Row>
            )}
        </>
    );
};

export default AttachingModalContent;
