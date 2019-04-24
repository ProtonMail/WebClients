import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { noop } from 'proton-shared/lib/helpers/function';

import Input from './Input';
import useDebounceInput from './useDebounceInput';

/**
 * <SearchInput delay={500} onChange={handleChange} value={keywords} />
 * @param {Number} delay used to debounce search value (default: 0)
 * @param {Function} onChange returns directly the value and not the event
 * @param {String} value initial
 * @returns {React.Component}
 */
const SearchInput = ({ delay, onChange, value, ...rest }) => {
    const [keywords, setKeywords] = useState(value);
    const words = useDebounceInput(keywords, delay);
    const handleChange = ({ target }) => setKeywords(target.value);

    useEffect(() => {
        onChange(words);
    }, [words]);

    return <Input value={keywords} onChange={handleChange} type="search" {...rest} />;
};

SearchInput.propTypes = {
    delay: PropTypes.number,
    onChange: PropTypes.func,
    value: PropTypes.string
};

SearchInput.defaultProps = {
    delay: 0,
    onChange: noop,
    value: ''
};

export default SearchInput;
