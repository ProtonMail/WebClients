import { FREQUENCY, MAX_LENGTHS } from 'proton-shared/lib/calendar/constants';
import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import React, { HTMLAttributes } from 'react';
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
    TITLE_INPUT_ID,
} from './const';
import createPropFactory from './eventForm/createPropFactory';
import IconRow from './IconRow';
import CalendarSelect from './inputs/CalendarSelect';
import CustomFrequencySelector from './inputs/CustomFrequencySelector';
import FrequencyInput from './inputs/FrequencyInput';
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
        fullDayNotifications,
        defaultFullDayNotification,
        partDayNotifications,
        defaultPartDayNotification,
        calendars,
    } = model;
    const propsFor = createPropFactory({ model, setModel });

    const isCustomFrequencySet = frequencyModel.type === FREQUENCY.CUSTOM;

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

    return (
        <div {...props}>
            <IconRow id={TITLE_INPUT_ID}>
                <Input
                    id={TITLE_INPUT_ID}
                    placeholder={c('Placeholder').t`Add title`}
                    autoFocus
                    maxLength={MAX_LENGTHS.TITLE}
                    {...propsFor('title', true)}
                />
            </IconRow>
            {dateRow}
            {!isMinimal && (
                <IconRow icon="reload" title={c('Label').t`Frequency`} id={FREQUENCY_INPUT_ID}>
                    <div>
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
            )}
            <IconRow icon="address" title={c('Label').t`Location`} id={LOCATION_INPUT_ID}>
                <Input
                    id={LOCATION_INPUT_ID}
                    placeholder={c('Placeholder').t`Add location`}
                    maxLength={MAX_LENGTHS.LOCATION}
                    {...propsFor('location', true)}
                />
            </IconRow>
            {!isMinimal && (
                <IconRow icon="notifications-enabled" title={c('Label').t`Notifications`}>
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
                    maxLength={MAX_LENGTHS.EVENT_DESCRIPTION}
                    {...propsFor('description', true)}
                />
            </IconRow>
        </div>
    );
};

export default EventForm;
