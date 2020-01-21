import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Label, Row, Field, ColorSelector } from 'react-components';

function NewLabelForm({ label, onChangeColor, onChangeName }) {
    return (
        <div className="w90 center flex-item-fluid">
            <Row>
                <Label htmlFor="accountName">{c('New Label form').t`Name`}</Label>
                <Field>
                    <Input
                        id="accountName"
                        value={label.Name}
                        onChange={onChangeName}
                        placeholder={c('New Label form').t`Name`}
                        required
                        data-test-id="label/folder-modal:name"
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="accountType">{c('New Label form').t`Color`} </Label>
                <Field>
                    <ColorSelector selected={label.Color} onChange={onChangeColor} />
                </Field>
            </Row>
        </div>
    );
}

NewLabelForm.propTypes = {
    label: PropTypes.object,
    onChangeName: PropTypes.func.isRequired,
    onChangeColor: PropTypes.func.isRequired
};

export default NewLabelForm;
