import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { SearchInput, Icon } from 'react-components';

import { classnames } from '../../helpers/component';

const Searchbox = ({ className = '', advanced, placeholder = '', value = '', onSearch, onChange }) => {
    const [search, updateSearch] = useState(value);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSearch && onSearch(search);
    };

    const handleChange = (newSearch) => {
        updateSearch(newSearch);
        onChange && onChange(newSearch);
    };

    useEffect(() => {
        // needed in case the search is cleared
        updateSearch(value);
    }, [value === '']);

    return (
        <form
            name="searchbox"
            className={classnames(['searchbox-container relative flex-item-centered-vert', className])}
            onSubmit={handleSubmit}
        >
            <label htmlFor="global_search">
                <span className="sr-only">{placeholder}</span>
                <SearchInput
                    value={search}
                    onChange={handleChange}
                    id="global_search"
                    placeholder={placeholder}
                    className="searchbox-field"
                />
            </label>
            <button type="submit" className="searchbox-search-button flex">
                <Icon name="search" className="fill-white mauto searchbox-search-button-icon" />
                <span className="sr-only">{c('Action').t`Search`}</span>
            </button>
            {advanced}
        </form>
    );
};

Searchbox.propTypes = {
    className: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onSearch: PropTypes.func,
    onChange: PropTypes.func,
    advanced: PropTypes.node
};

export default Searchbox;
