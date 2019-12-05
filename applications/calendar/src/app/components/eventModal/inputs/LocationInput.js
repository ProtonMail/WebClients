import React from 'react';
import { Input } from 'react-components';
import { c } from 'ttag';
import { MAX_LENGTHS } from '../../../constants';

const LocationInput = ({ onChange, ...rest }) => {
    return (
        <Input
            placeholder={c('Placeholder').t`Add a location`}
            onChange={({ target }) => onChange(target.value)}
            maxLength={MAX_LENGTHS.LOCATION}
            {...rest}
        />
    );
};

export default LocationInput;
