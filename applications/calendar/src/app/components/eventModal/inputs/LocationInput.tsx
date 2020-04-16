import React from 'react';
import { Input } from 'react-components';
import { Props as InputProps } from 'react-components/components/input/Input';
import { c } from 'ttag';
import { MAX_LENGTHS } from '../../../constants';

export interface Props extends Omit<InputProps, 'onChange'> {
    onChange: (value: string) => void;
}

const LocationInput = ({ onChange, ...rest }: Props) => {
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
