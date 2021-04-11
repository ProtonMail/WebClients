import React from 'react';
import { c } from 'ttag';

import { MAX_DEFAULT_NOTIFICATIONS } from 'proton-shared/lib/calendar/constants';
import { CalendarViewModelFull } from 'proton-shared/lib/interfaces/calendar';
import { Row, Label, Field, SelectTwo, Option } from '../../../components';
import Notifications from '../notifications/Notifications';

interface Props {
    model: CalendarViewModelFull;
    setModel: React.Dispatch<React.SetStateAction<CalendarViewModelFull>>;
}

const EventSettingsTab = ({ model, setModel }: Props) => {
    return (
        <>
            <Row>
                <Label htmlFor="duration-select">{c('Label').t`Default event duration`}</Label>
                <Field>
                    <SelectTwo
                        id="duration-select"
                        data-test-id="create-calendar/event-settings:event-duration"
                        value={model.duration}
                        onChange={({ value }) => setModel({ ...model, duration: +value })}
                    >
                        {[
                            { text: c('Duration').t`30 minutes`, value: 30 },
                            { text: c('Duration').t`60 minutes`, value: 60 },
                            { text: c('Duration').t`90 minutes`, value: 90 },
                            { text: c('Duration').t`120 minutes`, value: 120 },
                        ].map(({ value, text }) => (
                            <Option key={value} value={value} title={text} />
                        ))}
                    </SelectTwo>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Default notifications`}</Label>
                <div data-test-id="create-calendar/event-settings:default-notification" className="flex-item-fluid">
                    <Notifications
                        notifications={model.partDayNotifications}
                        canAdd={model.partDayNotifications.length < MAX_DEFAULT_NOTIFICATIONS}
                        defaultNotification={model.defaultPartDayNotification}
                        onChange={(notifications) => {
                            setModel({
                                ...model,
                                partDayNotifications: notifications,
                            });
                        }}
                    />
                </div>
            </Row>
            <Row>
                <Label>{c('Label').t`Default full day notifications`}</Label>
                <div
                    data-test-id="create-calendar/event-settings:default-full-day-notification"
                    className="flex-item-fluid"
                >
                    <Notifications
                        notifications={model.fullDayNotifications}
                        canAdd={model.fullDayNotifications.length < MAX_DEFAULT_NOTIFICATIONS}
                        defaultNotification={model.defaultFullDayNotification}
                        onChange={(notifications) => {
                            setModel({
                                ...model,
                                fullDayNotifications: notifications,
                            });
                        }}
                    />
                </div>
            </Row>
        </>
    );
};

export default EventSettingsTab;
