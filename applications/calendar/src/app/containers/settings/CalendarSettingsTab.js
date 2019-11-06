import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Row, Label, Field, Select, Toggle, ColorPicker, Input, TextArea } from 'react-components';
import { c } from 'ttag';

const CalendarSettingsTab = ({ model, setModel }) => {
    const addressText = useMemo(() => {
        const option = model.addressOptions.find(({ value: ID }) => ID === model.addressID);
        return (option && option.text) || '';
    }, [model.addressID, model.addressOptions]);

    return (
        <>
            <Row>
                <Label htmlFor="calendar-name-input">{c('Label').t`Name`}</Label>
                <Field>
                    <Input
                        id="calendar-name-input"
                        value={model.name}
                        placeholder={c('Placeholder').t`Add a calendar name`}
                        required
                        onChange={({ target }) => setModel({ ...model, name: target.value })}
                    />
                </Field>
                <div className="ml1">
                    <ColorPicker color={model.color} onChange={({ hex: color }) => setModel({ ...model, color })} />
                </div>
            </Row>
            <Row>
                <Label htmlFor="calendar-address-select">
                    <span className="mr0-5">{c('Label').t`Default email`}</span>
                </Label>
                <Field>
                    {
                        model.calendarID
                            ? addressText
                            : <Select
                                id="calendar-address-select"
                                value={model.addressID}
                                onChange={({ target }) => setModel({ ...model, addressID: target.value })}
                                options={model.addressOptions}
                            />
                    }
                </Field>
            </Row>
            <Row>
                <Label htmlFor="calendar-display-toggle">{c('Label').t`Display`}</Label>
                <Field>
                    <Toggle
                        id="calendar-display-toggle"
                        checked={!!model.display}
                        onChange={({ target }) => setModel({ ...model, display: target.checked })}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="calendar-description-textarea">{c('Label').t`Description`}</Label>
                <Field>
                    <TextArea
                        autoGrow={true}
                        id="calendar-description-textarea"
                        value={model.description}
                        placeholder={c('Placeholder').t`Add a calendar description`}
                        onChange={({ target }) => setModel({ ...model, description: target.value })}
                    />
                </Field>
            </Row>
        </>
    );
};

CalendarSettingsTab.propTypes = {
    addresses: PropTypes.array,
    addressesKeysMap: PropTypes.object,
    calendar: PropTypes.object,
    model: PropTypes.object,
    setModel: PropTypes.func,
    onClose: PropTypes.func
};

export default CalendarSettingsTab;
