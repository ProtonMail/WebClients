import React, { HTMLAttributes } from 'react';
import { FEATURE_FLAGS } from 'proton-shared/lib/constants';
import { FREQUENCY, MAX_LENGTHS } from 'proton-shared/lib/calendar/constants';
import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import { classnames, Input, TextArea } from 'react-components';
import { c } from 'ttag';
import { MAX_NOTIFICATIONS } from '../../constants';
import { EventModel, EventModelErrors } from '../../interfaces/EventModel';
import { NotificationModel } from '../../interfaces/NotificationModel';
import {
    CALENDAR_INPUT_ID,
    DESCRIPTION_INPUT_ID,
    FREQUENCY_INPUT_ID,
    LOCATION_INPUT_ID,
    NOTIFICATION_INPUT_ID,
    PARTICIPANTS_INPUT_ID,
    TITLE_INPUT_ID,
} from './const';
import createHandlers from './eventForm/createPropFactory';
import IconRow from './IconRow';
import CalendarSelect from './inputs/CalendarSelect';
import CustomFrequencySelector from './inputs/CustomFrequencySelector';
import FrequencyInput from './inputs/FrequencyInput';
import ParticipantsInput from './inputs/ParticipantsInput';
import Notifications from './Notifications';
import DateTimeRow from './rows/DateTimeRow';
import MiniDateTimeRows from './rows/MiniDateTimeRows';

interface Props {
    isSubmitted: boolean;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    errors: EventModelErrors;
    model: EventModel;
    setModel: (value: EventModel) => void;
    tzid?: string;
    isMinimal?: boolean;
}

const EventForm = ({
    isSubmitted,
    displayWeekNumbers,
    weekStartsOn,
    errors,
    model,
    setModel,
    tzid,
    isMinimal,
    ...props
}: Props & HTMLAttributes<HTMLDivElement>) => {
    const {
        frequencyModel,
        start,
        isAllDay,
        isOrganizer,
        fullDayNotifications,
        defaultFullDayNotification,
        partDayNotifications,
        defaultPartDayNotification,
        calendars,
    } = model;
    const isSingleEdit = !!model.rest?.['recurrence-id'];

    const isCustomFrequencySet = frequencyModel.type === FREQUENCY.CUSTOM;
    const showParticipants = FEATURE_FLAGS.includes('calendar-invitations');

    const dateRow = isMinimal ? (
        <MiniDateTimeRows
            model={model}
            setModel={setModel}
            endError={errors.end}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
        />
    ) : (
        <DateTimeRow
            model={model}
            setModel={setModel}
            endError={errors.end}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
            tzid={tzid!}
        />
    );
    const titleRow = isOrganizer ? (
        <IconRow id={TITLE_INPUT_ID} title={c('Label').t`Event title`}>
            <Input
                id={TITLE_INPUT_ID}
                placeholder={c('Placeholder').t`Add title`}
                title={c('Title').t`Add event title`}
                autoFocus
                maxLength={MAX_LENGTHS.TITLE}
                {...createHandlers({ model, setModel, field: 'title' }).native}
            />
        </IconRow>
    ) : null;

    return (
        <div className="mt0-5" {...props}>
            {titleRow}
            {isOrganizer && dateRow}
            {!isMinimal && isOrganizer && (
                <IconRow icon="reload" title={c('Label').t`Event frequency`} id={FREQUENCY_INPUT_ID}>
                    <FrequencyInput
                        className={classnames([isCustomFrequencySet && 'mb0-5'])}
                        id={FREQUENCY_INPUT_ID}
                        data-test-id="event-modal/frequency:select"
                        value={frequencyModel.type}
                        onChange={(type) =>
                            setModel({
                                ...model,
                                frequencyModel: { ...frequencyModel, type },
                                hasTouchedRrule: true,
                            })
                        }
                        title={c('Title').t`Select event frequency`}
                    />
                    {isCustomFrequencySet && (
                        <CustomFrequencySelector
                            frequencyModel={frequencyModel}
                            start={start}
                            displayWeekNumbers={displayWeekNumbers}
                            weekStartsOn={weekStartsOn}
                            errors={errors}
                            isSubmitted={isSubmitted}
                            onChange={(frequencyModel) => setModel({ ...model, frequencyModel, hasTouchedRrule: true })}
                        />
                    )}
                </IconRow>
            )}
            {!isMinimal && isOrganizer && showParticipants && (
                <IconRow icon="contacts-groups" title={c('Label').t`Participants`} id={PARTICIPANTS_INPUT_ID}>
                    <ParticipantsInput
                        placeholder={c('Placeholder').t`Add participants`}
                        id={PARTICIPANTS_INPUT_ID}
                        {...createHandlers({ model, setModel, field: 'attendees' }).model}
                    />
                </IconRow>
            )}
            {isOrganizer && (
                <IconRow icon="address" title={c('Label').t`Event location`} id={LOCATION_INPUT_ID}>
                    <Input
                        id={LOCATION_INPUT_ID}
                        placeholder={c('Placeholder').t`Add location`}
                        maxLength={MAX_LENGTHS.LOCATION}
                        title={c('Title').t`Add event location`}
                        {...createHandlers({ model, setModel, field: 'location' }).native}
                    />
                </IconRow>
            )}
            {!isMinimal && (
                <IconRow
                    id={NOTIFICATION_INPUT_ID}
                    icon="notifications-enabled"
                    title={c('Label').t`Event notifications`}
                >
                    {isAllDay ? (
                        <Notifications
                            {...{
                                errors,
                                canAdd: fullDayNotifications.length < MAX_NOTIFICATIONS,
                                notifications: fullDayNotifications,
                                defaultNotification: defaultFullDayNotification,
                                onChange: (notifications: NotificationModel[]) => {
                                    setModel({
                                        ...model,
                                        fullDayNotifications: notifications,
                                        hasTouchedNotifications: {
                                            ...model.hasTouchedNotifications,
                                            fullDay: true,
                                        },
                                    });
                                },
                            }}
                        />
                    ) : (
                        <Notifications
                            {...{
                                errors,
                                canAdd: partDayNotifications.length < MAX_NOTIFICATIONS,
                                notifications: partDayNotifications,
                                defaultNotification: defaultPartDayNotification,
                                onChange: (notifications: NotificationModel[]) => {
                                    setModel({
                                        ...model,
                                        partDayNotifications: notifications,
                                        hasTouchedNotifications: {
                                            ...model.hasTouchedNotifications,
                                            partDay: true,
                                        },
                                    });
                                },
                            }}
                        />
                    )}
                </IconRow>
            )}
            {calendars.length > 0 ? (
                <IconRow
                    icon="calendar"
                    title={c('Label').t`Your calendars`}
                    id={CALENDAR_INPUT_ID}
                    className="flex-item-fluid relative"
                >
                    <CalendarSelect
                        withIcon={false}
                        id={CALENDAR_INPUT_ID}
                        title={c('Title').t`Select which calendar to add this event to`}
                        disabled={!isOrganizer && isSingleEdit}
                        {...{ model, setModel }}
                    />
                </IconRow>
            ) : null}
            {isOrganizer && (
                <IconRow icon="text-align-left" title={c('Label').t`Description`} id={DESCRIPTION_INPUT_ID}>
                    <TextArea
                        id={DESCRIPTION_INPUT_ID}
                        minRows={2}
                        autoGrow
                        placeholder={c('Placeholder').t`Add description`}
                        maxLength={MAX_LENGTHS.EVENT_DESCRIPTION}
                        title={c('Title').t`Add more information related to this event`}
                        {...createHandlers({ model, setModel, field: 'description' }).native}
                    />
                </IconRow>
            )}
        </div>
    );
};

export default EventForm;
