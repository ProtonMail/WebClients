import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SearchInput, SimpleDropdown, Icon } from 'react-components';
import { PrimaryButton } from '../../components/button';
import { c } from 'ttag';

const SearchDropdown = ({
    search: initialSearch = '',
    onSearch,
    placeholder = c('Placeholder').t`Search`,
    ...rest
}) => {
    const [search, updateSearch] = useState(initialSearch);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSearch(search);
        updateSearch('');
    };

    return (
        <SimpleDropdown autoClose={false} content={<Icon name="search" />} {...rest}>
            <form className="p1" name="search-dropdown" onSubmit={handleSubmit}>
                <div className="mb1">
                    <SearchInput
                        autoFocus={true}
                        delay={0}
                        value={search}
                        onChange={(newValue) => updateSearch(newValue)}
                        placeholder={placeholder}
                    />
                </div>
                <div>
                    <PrimaryButton className="w100" type="submit">{c('Action').t`Search`}</PrimaryButton>
                </div>
            </form>
        </SimpleDropdown>
    );
};

SearchDropdown.propTypes = {
    search: PropTypes.string,
    onSearch: PropTypes.func,
    placeholder: PropTypes.string
};

export default SearchDropdown;
