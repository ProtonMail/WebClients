import { useState } from 'react';

import { c, msgid } from 'ttag';

import { MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import {
    CalendarImportMapping,
    CalendarImporterPayload,
    ImportedCalendar,
} from '@proton/shared/lib/interfaces/EasySwitch';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import { FormModal, Icon, PrimaryButton } from '../../../../components';
import { classnames } from '../../../../helpers/component';
import { CALENDAR_TO_BE_CREATED_PREFIX } from '../../constants';
import CustomizeCalendarImportRow from './CustomizeCalendarImportRow';

interface Props {
    providerCalendars: ImportedCalendar[];
    calendars: VisualCalendar[];
    activeCalendars: VisualCalendar[];
    importedEmailAddress: string;
    toEmail: string;
    payload: CalendarImporterPayload;
    onUpdateCalendarMapping: (mapping: CalendarImportMapping[]) => void;
    onClose?: () => void;
}

type CheckedMap = {
    [k: string]: boolean;
};

type CalendarMapping = {
    [k: string]: string;
};

const CustomizeCalendarImportModal = ({
    providerCalendars,
    calendars,
    activeCalendars,
    importedEmailAddress,
    toEmail,
    payload,
    onUpdateCalendarMapping,
    onClose = noop,
    ...rest
}: Props) => {
    const { Mapping } = payload;

    const [checkedMap, setCheckedMap] = useState(
        providerCalendars.reduce<CheckedMap>((acc, { ID }) => {
            const found = Mapping.find(({ Source }) => Source === ID);
            acc[ID] = !!found;
            return acc;
        }, {})
    );

    const toggleChecked = (id: string) => {
        setCheckedMap({
            ...checkedMap,
            [id]: !checkedMap[id],
        });
    };

    const [calendarMapping, setCalendarMapping] = useState(
        providerCalendars.reduce<CalendarMapping>((acc, { ID, Source }) => {
            const found = Mapping.find(({ Source }) => Source === ID);

            acc[ID] = found ? found.Destination : `${CALENDAR_TO_BE_CREATED_PREFIX}${Source}`;
            return acc;
        }, {})
    );

    const updateCalendarMapping = (calendarID: string, destination: string) => {
        setCalendarMapping({
            ...calendarMapping,
            [calendarID]: destination,
        });
    };

    const selectedCalendars = providerCalendars.filter(({ ID }) => checkedMap[ID]);
    const selectedCalendarsTotal = selectedCalendars.length;

    const handleSubmit = () => {
        const Mapping = selectedCalendars.map<CalendarImportMapping>(({ ID, Description }) => ({
            Source: ID,
            Destination: calendarMapping[ID],
            Description,
        }));

        onUpdateCalendarMapping(Mapping);
        onClose();
    };

    // translator: the variables here are the number of selected calendar and number of total calendar. Example of the complete sentence: "5 of 7 calendars"
    const calendarsSelectedCopy = c('Info').ngettext(
        msgid`${selectedCalendarsTotal} of ${providerCalendars.length} calendar`,
        `${selectedCalendarsTotal} of ${providerCalendars.length} calendars`,
        providerCalendars.length
    );

    const calendarsToBeCreatedCount = selectedCalendars.filter(
        ({ ID, Source }) => `${CALENDAR_TO_BE_CREATED_PREFIX}${Source}` === calendarMapping[ID]
    ).length;

    // translator: the variable ${calendarsToBeCreatedCount} is the number of calendars to be created. Example of the complete sentence: "5 new calendars"
    const calendarsToBeCreatedCopy = c('Info').ngettext(
        msgid`${calendarsToBeCreatedCount} new calendar`,
        `${calendarsToBeCreatedCount} new calendars`,
        calendarsToBeCreatedCount
    );

    const calendarsToBeMergedCount = selectedCalendars.length - calendarsToBeCreatedCount;

    // translator: the variable ${calendarsToBeMergedCount} is the number of calendars to be merged with an existing Proton calendar. Example of the complete sentence: "5 merged calendars".
    const calendarsToBeMergedCopy = c('Info').ngettext(
        msgid`${calendarsToBeMergedCount} merged calendar`,
        `${calendarsToBeMergedCount} merged calendars`,
        calendarsToBeMergedCount
    );

    const importSummaryRenderer = () => {
        return (
            <>
                {!!calendarsToBeCreatedCount && calendarsToBeCreatedCopy}
                {!!calendarsToBeCreatedCount && !!calendarsToBeMergedCount && <br />}
                {!!calendarsToBeMergedCount && calendarsToBeMergedCopy}
            </>
        );
    };

    const calendarLimitReached = calendarsToBeCreatedCount + calendars.length > MAX_CALENDARS_PAID;
    const disabled = calendarLimitReached || selectedCalendarsTotal === 0;
    const calendarToFixCount = Math.abs(MAX_CALENDARS_PAID - calendars.length - calendarsToBeCreatedCount);

    const canMerge = activeCalendars.length > 0;

    const errorBox = (
        <div className="rounded-lg p1 mb1 bg-danger color-white text-semibold border-none">
            {c('Error').t`You have reached the maximum number of personal calendars. Some calendars couldn't be imported.`}
            <ul className="m0">
                <li>
                    {canMerge
                        ? c('Error').ngettext(
                              msgid`Deselect at least ${calendarToFixCount} calendar or`,
                              `Deselect at least ${calendarToFixCount} calendars or`,
                              calendarToFixCount
                          )
                        : c('Error').ngettext(
                              msgid`Deselect at least ${calendarToFixCount} calendar`,
                              `Deselect at least ${calendarToFixCount} calendars`,
                              calendarToFixCount
                          )}
                </li>
                {canMerge && (
                    <li>
                        {c('Error').ngettext(
                            msgid`Merge at least ${calendarToFixCount} calendar with an existing Proton calendar`,
                            `Merge at least ${calendarToFixCount} calendars with existing Proton calendars`,
                            calendarToFixCount
                        )}
                    </li>
                )}
            </ul>
        </div>
    );

    return (
        <FormModal
            title={c('Title').t`Customize calendar import`}
            close={c('Action').t`Cancel`}
            onSubmit={handleSubmit}
            onClose={onClose}
            submit={
                <PrimaryButton disabled={disabled} type="submit">
                    {c('Action').t`Save`}
                </PrimaryButton>
            }
            {...rest}
        >
            <div className="mb1">
                {c('Info')
                    .t`Select which calendars to import. A new calendar will be created for each imported calendar up to the 20 calendars limit.`}
                {canMerge && ` ${c('Info').t`You can also merge imported calendars with existing Proton calendars.`}`}
            </div>

            {calendarLimitReached && errorBox}

            <div className="flex mt2">
                <div className="flex-item-fluid">
                    <div className="text-sm text-bold m0 lh100 mb0-5">{c('Info').t`Import from`}</div>
                    <strong className="block mb0-5">{importedEmailAddress}</strong>
                    <div className="color-weak">{calendarsSelectedCopy}</div>
                </div>
                <div className="flex-item-fluid">
                    <div className="text-sm text-bold m0 lh100 mb0-5">{c('Info').t`Create in`}</div>
                    <strong className="block mb0-5">{toEmail}</strong>
                    {selectedCalendarsTotal > 0 && (
                        <div className={classnames(['flex', calendarLimitReached ? 'color-danger' : 'color-weak'])}>
                            {calendarLimitReached && (
                                <Icon
                                    name="exclamation-circle-filled"
                                    className="color-danger flex-align-self-center mr0-5"
                                />
                            )}
                            {importSummaryRenderer()}
                        </div>
                    )}
                </div>
            </div>

            {providerCalendars.map((calendar, i) => (
                <CustomizeCalendarImportRow
                    key={calendar.ID}
                    calendar={calendar}
                    checked={checkedMap[calendar.ID]}
                    toggleChecked={toggleChecked}
                    isLast={i + 1 === providerCalendars.length}
                    activeCalendars={activeCalendars}
                    value={calendarMapping[calendar.ID]}
                    updateCalendarMapping={updateCalendarMapping}
                    calendarLimitReached={calendarLimitReached}
                />
            ))}
        </FormModal>
    );
};

export default CustomizeCalendarImportModal;
