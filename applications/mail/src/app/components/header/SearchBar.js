import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SearchInput, Icon } from 'react-components';
import { c } from 'ttag';

const SearchBar = ({ location, onSearch }) => {
    console.log(location);
    const [search, updateSearch] = useState('');
    const handleSubmit = (event) => {
        event.preventDefault();
        onSearch(search);
    };
    return (
        <form
            name="search-form"
            className="searchbox-container relative flex-item-centered-vert"
            onSubmit={handleSubmit}
        >
            <label htmlFor="global_search">
                <span className="sr-only">{c('Placeholder').t`Search`}</span>
                <SearchInput
                    value={search}
                    onChange={updateSearch}
                    id="global_search"
                    placeholder={c('Placeholder').t`Search`}
                    className="searchbox-field"
                />
            </label>
            <button type="submit" title={c('Action').t`Search`} className="searchbox-search-button flex">
                <Icon name="search" className="fill-white mauto searchbox-search-button-icon" />
            </button>
            <button type="button" className="searchbox-advanced-search-button">
                <Icon name="caret" className="fill-white searchbox-advanced-search-icon" />
            </button>
        </form>
    );
};

SearchBar.propTypes = {
    location: PropTypes.object.isRequired,
    onSearch: PropTypes.func.isRequired
};

export default SearchBar;
