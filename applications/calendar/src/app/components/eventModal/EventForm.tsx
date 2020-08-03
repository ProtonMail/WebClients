import React from 'react';
import { classnames, Input, TextArea } from 'react-components';
import { c } from 'ttag';
import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import { FREQUENCY, MAX_LENGTHS } from 'proton-shared/lib/calendar/constants';
import { MAX_NOTIFICATIONS } from '../../constants';
import { EventModel, EventModelErrors } from '../../interfaces/EventModel';
import { NotificationModel } from '../../interfaces/NotificationModel';
import {
    CALENDAR_INPUT_ID,
    DESCRIPTION_INPUT_ID,
    FREQUENCY_INPUT_ID,
    LOCATION_INPUT_ID,
    TITLE_INPUT_ID,
} from './const';
import createPropFactory from './eventForm/createPropFactory';
import IconRow from './IconRow';
import CalendarSelect from './inputs/CalendarSelect';
import CustomFrequencySelector from './inputs/CustomFrequencySelector';
import FrequencyInput from './inputs/FrequencyInput';
import LocationInput from './inputs/LocationInput';
import Notifications from './Notifications';
import DateTimeRow from './rows/DateTimeRow';

interface Props {
    isSubmitted: boolean;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    errors: EventModelErrors;
    model: EventModel;
    setModel: (value: EventModel) => void;
    tzid: string;
}

const EventForm = ({ isSubmitted, displayWeekNumbers, weekStartsOn, errors, model, setModel, tzid }: Props) => {
    const { frequencyModel, start } = model;
    const propsFor = createPropFactory({ model, setModel });

    const isCustomFrequencySet = frequencyModel.type === FREQUENCY.CUSTOM;

    return (
        <div className="mt2">
            <IconRow id={TITLE_INPUT_ID}>
                <Input
                    id={TITLE_INPUT_ID}
                    placeholder={c('Placeholder').t`Add title`}
                    autoFocus
                    maxLength={MAX_LENGTHS.TITLE}
                    value={propsFor('title').value}
                    onChange={({ target }) => propsFor('title').onChange(target.value)}
                />
            </IconRow>
            <IconRow icon="clock" title={c('Label').t`Time`}>
                <DateTimeRow
                    model={model}
                    setModel={setModel}
                    endError={errors.end}
                    displayWeekNumbers={displayWeekNumbers}
                    weekStartsOn={weekStartsOn}
                    tzid={tzid}
                />
            </IconRow>
            <IconRow icon="reload" title={c('Label').t`Frequency`} id={FREQUENCY_INPUT_ID}>
                <div>
                    <FrequencyInput
                        className={classnames([isCustomFrequencySet && 'mb0-5'])}
                        id={FREQUENCY_INPUT_ID}
                        data-test-id="event-modal/frequency:select"
                        value={frequencyModel.type}
                        onChange={(type) => setModel({ ...model, frequencyModel: { ...frequencyModel, type } })}
                    />
                    {isCustomFrequencySet && (
                        <div className="flex flex-nowrap flex-item-fluid">
                            <CustomFrequencySelector
                                frequencyModel={frequencyModel}
                                start={start}
                                displayWeekNumbers={displayWeekNumbers}
                                weekStartsOn={weekStartsOn}
                                errors={errors}
                                isSubmitted={isSubmitted}
                                onChange={(frequencyModel) =>
                                    setModel({ ...model, frequencyModel, hasTouchedRrule: true })
                                }
                            />
                        </div>
                    )}
                </div>
            </IconRow>
            <IconRow icon="address" title={c('Label').t`Location`} id={LOCATION_INPUT_ID}>
                <LocationInput id={LOCATION_INPUT_ID} {...propsFor('location')} />
            </IconRow>
            <IconRow icon="notifications-enabled" title={c('Label').t`Notifications`}>
                {model.isAllDay ? (
                    <Notifications
                        {...{
                            errors,
                            canAdd: model.fullDayNotifications.length < MAX_NOTIFICATIONS,
                            notifications: model.fullDayNotifications,
                            defaultNotification: model.defaultFullDayNotification,
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
                            canAdd: model.partDayNotifications.length < MAX_NOTIFICATIONS,
                            notifications: model.partDayNotifications,
                            defaultNotification: model.defaultPartDayNotification,
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
            {model.calendars.length > 0 ? (
                <IconRow
                    icon="calendar"
                    title={c('Label').t`Calendar`}
                    id={CALENDAR_INPUT_ID}
                    className="flex-item-fluid relative"
                >
                    <CalendarSelect withIcon={false} id={CALENDAR_INPUT_ID} {...{ model, setModel }} />
                </IconRow>
            ) : null}
            <IconRow icon="text-align-left" title={c('Label').t`Description`} id={DESCRIPTION_INPUT_ID}>
                <TextArea
                    id={DESCRIPTION_INPUT_ID}
                    minRows={2}
                    autoGrow
                    placeholder={c('Placeholder').t`Add description`}
                    onChange={({ target }: React.ChangeEvent<HTMLTextAreaElement>) =>
                        propsFor('description').onChange(target.value)
                    }
                    value={model.description}
                    maxLength={MAX_LENGTHS.EVENT_DESCRIPTION}
                />
            </IconRow>
        </div>
    );
};

export default EventForm;
