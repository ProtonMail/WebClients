import React, { ChangeEvent } from 'react';
import { Row, Label, Field, Select } from 'react-components';
import { c } from 'ttag';
import Notifications from '../../components/eventModal/Notifications';

import { MAX_DEFAULT_NOTIFICATIONS } from '../../constants';
import { CalendarErrors, CalendarModel } from '../../interfaces/CalendarModel';

interface Props {
    model: CalendarModel;
    setModel: React.Dispatch<React.SetStateAction<CalendarModel>>;
    isSubmitted: boolean;
    errors: CalendarErrors;
}

const EventSettingsTab = ({ model, setModel }: Props) => {
    return (
        <>
            <Row>
                <Label>{c('Label').t`Default event duration`}</Label>
                <Field>
                    <Select
                        data-test-id="create-calendar/event-settings:event-duration"
                        value={model.duration}
                        options={[
                            { text: c('Duration').t`30 minutes`, value: 30 },
                            { text: c('Duration').t`60 minutes`, value: 60 },
                            { text: c('Duration').t`90 minutes`, value: 90 },
                            { text: c('Duration').t`120 minutes`, value: 120 }
                        ]}
                        onChange={({ target }: ChangeEvent<HTMLSelectElement>) =>
                            setModel({ ...model, duration: +target.value })
                        }
                    />
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
                                partDayNotifications: notifications
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
                                fullDayNotifications: notifications
                            });
                        }}
                    />
                </div>
            </Row>
        </>
    );
};

export default EventSettingsTab;
