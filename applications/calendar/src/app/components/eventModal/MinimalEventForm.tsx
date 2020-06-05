import React from 'react';
import { c } from 'ttag';
import { Icon, DateInput, classnames, TimeInput } from 'react-components';

import AllDayCheckbox from './inputs/AllDayCheckbox';
import { getAllDayCheck } from './eventForm/stateActions';
import { EventModel, EventModelErrors } from '../../interfaces/EventModel';
import { WeekStartsOn } from '../../containers/calendar/interface';
import useDateTimeFormHandlers from './hooks/useDateTimeFormHandlers';
import createPropFactory from './eventForm/createPropFactory';
import { MINIMUM_DATE, MAXIMUM_DATE } from '../../constants';
import DescriptionInput from './inputs/DescriptionInput';
import LocationInput from './inputs/LocationInput';
import TitleInput from './inputs/TitleInput';
import CalendarSelect from './inputs/CalendarSelect';
import MinimalErrowRow from './MinimalErrorRow';
import MinimalEventRow from './MinimalEventRow';

const EnDash = () => <span className="ml0-5 mr0-5">–</span>;

interface Props {
    isSubmitted: boolean;
    isNarrow: boolean;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    errors: EventModelErrors;
    model: EventModel;
    setModel: (value: EventModel) => void;
}

const MinimalEventForm = ({ isSubmitted, displayWeekNumbers, weekStartsOn, errors, model, setModel }: Props) => {
    const {
        handleChangeStartDate,
        handleChangeStartTime,
        handleChangeEndTime,
        isDuration,
        minEndTime,
    } = useDateTimeFormHandlers({ model, setModel });
    const propsFor = createPropFactory({ model, setModel });

    return (
        <>
            <MinimalEventRow
                label={
                    <>
                        <Icon name="circle" color={model.calendar.color} />
                        <span className="sr-only">{c('Label').t`Title`}</span>
                    </>
                }
                labelFor="event-title-input"
            >
                <TitleInput id="event-title-input" type={model.type} isSubmitted={isSubmitted} {...propsFor('title')} />
            </MinimalEventRow>
            <MinimalEventRow label={<Icon name="clock" />} className="flex flex-nowrap flex-row flex-items-center w100">
                <DateInput
                    id="startDate"
                    className={classnames([!model.isAllDay && 'mr0-5', 'flex-item-fluid', 'flex-item-grow-2'])}
                    required
                    value={model.start.date}
                    onChange={handleChangeStartDate}
                    displayWeekNumbers={displayWeekNumbers}
                    weekStartsOn={weekStartsOn}
                    min={MINIMUM_DATE}
                    max={MAXIMUM_DATE}
                />
                {!model.isAllDay && (
                    <>
                        <TimeInput
                            className="flex-item-fluid"
                            id="startTime"
                            value={model.start.time}
                            onChange={handleChangeStartTime}
                        />
                        <EnDash />
                        <TimeInput
                            id="endTime"
                            className="flex-item-fluid"
                            value={model.end.time}
                            onChange={handleChangeEndTime}
                            aria-invalid={Boolean(errors.end)}
                            displayDuration={isDuration}
                            min={minEndTime}
                        />
                    </>
                )}
            </MinimalEventRow>
            <MinimalEventRow>
                <AllDayCheckbox
                    checked={model.isAllDay}
                    onChange={(isAllDay) => setModel({ ...model, ...getAllDayCheck(model, isAllDay) })}
                />
            </MinimalEventRow>
            {model.calendars.length > 1 ? (
                <MinimalEventRow
                    label={
                        <>
                            <Icon name="calendar" color={model.calendar.color} />
                            <span className="sr-only">{c('Label').t`Calendar`}</span>
                        </>
                    }
                    labelFor="event-calendar-select"
                >
                    <CalendarSelect
                        id="event-calendar-select"
                        withIcon
                        disabled={!model.hasCalendarRow}
                        model={model}
                        setModel={setModel}
                    />
                </MinimalEventRow>
            ) : null}
            <MinimalEventRow
                label={
                    <>
                        <Icon name="address" />
                        <span className="sr-only">{c('Label').t`Location`}</span>
                    </>
                }
                labelFor="event-location-input"
            >
                <LocationInput id="event-location-input" {...propsFor('location')} />
            </MinimalEventRow>
            <MinimalEventRow
                label={
                    <>
                        <Icon name="note" />
                        <span className="sr-only">{c('Label').t`Description`}</span>
                    </>
                }
                labelFor="event-description-input"
            >
                <DescriptionInput id="event-description-input" {...propsFor('description')} />
            </MinimalEventRow>
            <MinimalErrowRow errors={errors} />
        </>
    );
};

export default MinimalEventForm;
