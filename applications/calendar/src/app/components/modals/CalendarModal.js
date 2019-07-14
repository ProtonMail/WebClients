import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FormModal, Row, Label, Field, Input, ColorPicker, TextArea } from 'react-components';

const CalendarModal = ({ calendarID, ...rest }) => {
    const [model, updateModel] = useState({});
    const title = calendarID ? c('Title').t`Update calendar` : c('Title').t`Create calendar`;
    const handleSubmit = () => {};

    return (
        <FormModal
            title={title}
            submit={calendarID ? c('Action').t`Update` : c('Action').t`Create`}
            onSubmit={handleSubmit}
            {...rest}
        >
            <Row>
                <Label htmlFor="calendar-name-input">{c('Label').t`Name`}</Label>
                <Field>
                    <Input
                        id="calendar-name-input"
                        value={model.name}
                        placeholder={c('Placeholder').t`Name`}
                        onChange={({ target }) => updateModel({ ...model, name: target.value })}
                    />
                </Field>
                <div className="ml1">
                    <ColorPicker color={model.color} onChange={({ hex: color }) => updateModel({ ...model, color })}>
                        &nbsp;
                    </ColorPicker>
                </div>
            </Row>
            <Row>
                <Label htmlFor="calendar-description-textarea">{c('Label').t`Description`}</Label>
                <Field>
                    <TextArea
                        id="calendar-description-textarea"
                        value={model.description}
                        placeholder={c('Placeholder').t`Description`}
                        onChange={({ target }) => updateModel({ ...model, description: target.value })}
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

CalendarModal.propTypes = {
    calendarID: PropTypes.string
};

export default CalendarModal;
