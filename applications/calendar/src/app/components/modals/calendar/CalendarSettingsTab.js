import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
    Row,
    Label,
    Field,
    Select,
    Toggle,
    ColorPicker,
    Info,
    Input,
    TextArea,
    useNotifications
} from 'react-components';
import { getPrimaryKey } from 'proton-shared/lib/keys/keys';
import { c } from 'ttag';

const CalendarSettingsTab = ({ calendar, addressesKeysMap, addresses = [], model, updateModel, onClose }) => {
    const { createNotification } = useNotifications();
    const loadedRef = useRef(false);
    const options = addresses
        .filter(({ ID }) => {
            const addressKeys = addressesKeysMap ? addressesKeysMap[ID] : [];
            const { privateKey } = getPrimaryKey(addressKeys) || {};
            return privateKey && privateKey.isDecrypted();
        })
        .map(({ ID, DisplayName = '', Email = '' }) => ({
            value: ID,
            text: [DisplayName, Email].filter(Boolean).join(' ')
        }));

    useEffect(() => {
        if (loadedRef.current) {
            return;
        }

        loadedRef.current = true;

        if (!options.length) {
            createNotification({ text: c('Error').t`No address available`, type: 'error' });
            onClose();
            return;
        }

        if (!model.addressID) {
            updateModel({ ...model, addressID: options[0].value });
        }
    }, [options]);

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
                        onChange={({ target }) => updateModel({ ...model, name: target.value })}
                    />
                </Field>
                <div className="ml1">
                    <ColorPicker color={model.color} onChange={({ hex: color }) => updateModel({ ...model, color })}>
                        &nbsp;
                    </ColorPicker>
                </div>
            </Row>
            {calendar ? null : (
                <Row>
                    <Label htmlFor="calendar-address-select">
                        <span className="mr0-5">{c('Label').t`Default email`}</span>
                        <Info title={c('Tooltip').t`TODO`} />
                    </Label>
                    <Field>
                        <Select
                            id="calendar-address-select"
                            value={model.addressID}
                            onChange={({ target }) => updateModel({ ...model, addressID: target.value })}
                            options={options}
                        />
                    </Field>
                </Row>
            )}
            {calendar ? (
                <Row>
                    <Label htmlFor="calendar-display-toggle">{c('Label').t`Display`}</Label>
                    <Field>
                        <Toggle
                            id="calendar-display-toggle"
                            checked={model.display}
                            onChange={({ target }) => updateModel({ ...model, display: target.checked })}
                        />
                    </Field>
                </Row>
            ) : null}
            <Row>
                <Label htmlFor="calendar-description-textarea">{c('Label').t`Description`}</Label>
                <Field>
                    <TextArea
                        autoGrow={true}
                        id="calendar-description-textarea"
                        value={model.description}
                        placeholder={c('Placeholder').t`Add a calendar description`}
                        onChange={({ target }) => updateModel({ ...model, description: target.value })}
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
    updateModel: PropTypes.func,
    onClose: PropTypes.func
};

export default CalendarSettingsTab;
