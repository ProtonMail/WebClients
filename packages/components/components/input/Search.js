import React from 'react';
import Input from './Input';

const Search = (props) => {
    const { type, ...rest } = props;
    return (
        <Input
            type={type}
            {...rest}
            />
    );
};

Search.defaultProps = {
    type: 'search'
};

export default Search;