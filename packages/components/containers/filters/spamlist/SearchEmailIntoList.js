import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SearchInput } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

function SearchEmailIntoList({ onChange }) {
    return (
        <SearchInput
            delay={300}
            onChange={onChange}
            placeholder={c('FilterSettings').t`Search Whitelist and Blacklist`}
        />
    );
}

SearchEmailIntoList.propTypes = {
    className: PropTypes.string,
    onChange: PropTypes.func
};

SearchEmailIntoList.defaultProps = {
    className: '',
    onChange: noop
};

export default SearchEmailIntoList;
