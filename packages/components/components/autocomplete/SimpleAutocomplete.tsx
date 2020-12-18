import React from 'react';

import Autocomplete, { Props as AutocompleteProps } from './Autocomplete';

interface Props extends Omit<AutocompleteProps<string>, 'getData' | 'onSelect'> {}

const id = <T,>(x: T) => x;

const SimpleAutocomplete = ({ value = '', ...rest }: Props) => {
    return <Autocomplete {...rest} value={value} onSelect={rest.onChange} getData={id} />;
};

export default SimpleAutocomplete;
