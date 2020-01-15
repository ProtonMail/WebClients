import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { SearchInput, Icon, classnames } from 'react-components';

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

    const handleClear = () => {
        updateSearch('');
        onChange && onChange('');
        onSearch && onSearch('');
    };

    useEffect(() => {
        // needed in case the search is cleared
        updateSearch(value);
    }, [value === '']);

    return (
        <form
            role="search"
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
            {// Clear button is hidden when using advanced mode because the buttons use the same spots
            // If there is the need of having both, a positioning solution will have to be found
            !advanced && search !== '' && (
                <button type="button" className="searchbox-advanced-search-button flex" onClick={handleClear}>
                    <Icon name="close" className="fill-white mauto searchbox-search-button-icon" />
                    <span className="sr-only">{c('Action').t`Clear`}</span>
                </button>
            )}
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
