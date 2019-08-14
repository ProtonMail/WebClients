import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SearchInput } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

function SearchEmailIntoList({ onChange = noop }) {
    return (
        <SearchInput
            delay={300}
            onChange={onChange}
            placeholder={c('FilterSettings').t`Search Whitelist and Blacklist`}
        />
    );
}

SearchEmailIntoList.propTypes = {
    onChange: PropTypes.func
};

export default SearchEmailIntoList;
