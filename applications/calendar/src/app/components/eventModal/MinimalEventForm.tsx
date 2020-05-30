import React from 'react';
import { c } from 'ttag';
import { Icon, Row as LibRow, Label, DateInput, classnames, TimeInput } from 'react-components';

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
import { NotificationInfo } from './NotificationInfo';

interface RowProps {
    children: React.ReactNode;
    label?: React.ReactChild;
    className?: string;
    labelFor?: string;
}

const Row = ({ children, label = '', className, labelFor }: RowProps) => (
    <LibRow collapseOnMobile={false}>
        <Label htmlFor={labelFor}>{label}</Label>
        <div className={className || 'flex-item-fluid'}>{children}</div>
    </LibRow>
);

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
            <Row
                label={
                    <>
                        <Icon name="circle" color={model.calendar.color} />
                        <span className="sr-only">{c('Label').t`Title`}</span>
                    </>
                }
                labelFor="event-title-input"
            >
                <TitleInput id="event-title-input" type={model.type} isSubmitted={isSubmitted} {...propsFor('title')} />
            </Row>
            <Row label={<Icon name="clock" />} className="flex flex-nowrap flex-row flex-items-center w100">
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
            </Row>
            <Row>
                <AllDayCheckbox
                    checked={model.isAllDay}
                    onChange={(isAllDay) => setModel({ ...model, ...getAllDayCheck(model, isAllDay) })}
                />
            </Row>
            {model.calendars.length > 1 ? (
                <Row
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
                </Row>
            ) : null}
            <Row
                label={
                    <>
                        <Icon name="address" />
                        <span className="sr-only">{c('Label').t`Location`}</span>
                    </>
                }
                labelFor="event-location-input"
            >
                <LocationInput id="event-location-input" {...propsFor('location')} />
            </Row>
            <Row
                label={
                    <>
                        <Icon name="note" />
                        <span className="sr-only">{c('Label').t`Description`}</span>
                    </>
                }
                labelFor="event-description-input"
            >
                <DescriptionInput id="event-description-input" {...propsFor('description')} />
            </Row>
            <Row>
                <NotificationInfo model={model} errors={errors} />
            </Row>
        </>
    );
};

export default MinimalEventForm;
