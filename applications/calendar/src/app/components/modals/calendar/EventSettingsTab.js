import React from 'react';
import PropTypes from 'prop-types';
import { Row, Label, Field, Select } from 'react-components';
import { c } from 'ttag';

import NotificationInput from '../NotificationInput';
import { HOUR, MINUTE } from '../../../constants';

const EventSettingsTab = ({ model, updateModel }) => {
    return (
        <>
            <Row>
                <Label>{c('Label').t`Default event duration`}</Label>
                <Field>
                    <Select
                        value={model.duration}
                        options={[
                            { text: c('Duration').t`30 minutes`, value: 30 * MINUTE },
                            { text: c('Duration').t`60 minutes`, value: HOUR },
                            { text: c('Duration').t`90 minutes`, value: 90 * MINUTE },
                            { text: c('Duration').t`120 minutes`, value: 2 * HOUR }
                        ]}
                        onChange={({ target }) => updateModel({ ...model, duration: target.value })}
                    />
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Default notification`}</Label>
                <Field>
                    <NotificationInput />
                </Field>
            </Row>
            {/* <Row>
                <Label>
                    <span className="mr0-5">{c('Label').t`Send updates`}</span>
                    <Info title={c('Tooltip').t``} />
                </Label>
                <Field>
                    <Select />
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Send responses`}</Label>
                <Field>
                    <Select />
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Hide cancelled or declined events`}</Label>
                <Field>
                    <Toggle />
                </Field>
            </Row> */}
        </>
    );
};

EventSettingsTab.propTypes = {
    model: PropTypes.object,
    updateModel: PropTypes.func
};

export default EventSettingsTab;
