import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Label, Row, ColorSelector } from 'react-components';

function NewLabelForm({ label, onChangeColor, onChangeName }) {
    return (
        <div className="w90 center flex-item-fluid">
            <Row>
                <Label htmlFor="accountName">{c('New Label form').t`Name`}</Label>
                <Input
                    id="accountName"
                    value={label.Name}
                    onChange={onChangeName}
                    placeholder={c('New Label form').t`Name`}
                    required
                />
            </Row>
            <Row>
                <Label htmlFor="accountType">{c('New Label form').t`Color`} </Label>
                <ColorSelector selected={label.Color} onChange={onChangeColor} />
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
