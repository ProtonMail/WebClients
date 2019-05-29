import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Label } from 'react-components';
import { REGEX_EMAIL } from 'proton-shared/lib/constants';

function AddEmailToList({ onChange }) {
    const handleChange = ({ target }) => {
        if (REGEX_EMAIL.test(target.value || '')) {
            onChange(target.value);
        }
    };

    return (
        <div className="w90 center flex-item-fluid">
            <div className="flex flex-nowrap onmobile-flex-column mb1">
                <Label htmlFor="email">{c('Label').t`Email`}</Label>
                <Input
                    id="email"
                    type="email"
                    onChange={handleChange}
                    placeholder={c('Label').t`Email address`}
                    required={true}
                />
            </div>
        </div>
    );
}

AddEmailToList.propTypes = {
    onChange: PropTypes.func.isRequired
};

export default AddEmailToList;
