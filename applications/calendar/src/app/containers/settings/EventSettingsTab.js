import React from 'react';
import PropTypes from 'prop-types';
import { Row, Label, Field, Select } from 'react-components';
import { c } from 'ttag';
import Notifications from '../../components/eventModal/Notifications';

const EventSettingsTab = ({ model, setModel }) => {
    return (
        <>
            <Row>
                <Label>{c('Label').t`Default event duration`}</Label>
                <Field>
                    <Select
                        value={model.duration}
                        options={[
                            { text: c('Duration').t`30 minutes`, value: 30 },
                            { text: c('Duration').t`60 minutes`, value: 60 },
                            { text: c('Duration').t`90 minutes`, value: 90 },
                            { text: c('Duration').t`120 minutes`, value: 120 }
                        ]}
                        onChange={({ target }) => setModel({ ...model, duration: target.value })}
                    />
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Default notifications`}</Label>
                <div className="flex-item-fluid">
                    <Notifications
                        notifications={model.partDayNotifications}
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
                <div className="flex-item-fluid">
                    <Notifications
                        notifications={model.fullDayNotifications}
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

EventSettingsTab.propTypes = {
    model: PropTypes.object,
    setModel: PropTypes.func
};

export default EventSettingsTab;
