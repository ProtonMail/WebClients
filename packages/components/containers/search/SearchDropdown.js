import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SearchInput, DropdownButton, Dropdown, Icon, usePopperAnchor, PrimaryButton } from 'react-components';
import { c } from 'ttag';

import { generateUID } from '../../helpers/component';

const SearchDropdown = ({
    search: initialSearch = '',
    onSearch,
    placeholder = c('Placeholder').t`Search`,
    content = <Icon name="search" />,
    ...rest
}) => {
    const [uid] = useState(generateUID('search-dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();
    const [search, updateSearch] = useState(initialSearch);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSearch(search);
        updateSearch('');
        close();
    };

    return (
        <>
            <DropdownButton {...rest} buttonRef={anchorRef} isOpen={isOpen} onClick={toggle}>
                {content}
            </DropdownButton>
            <Dropdown id={uid} autoClose={false} isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
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
            </Dropdown>
        </>
    );
};

SearchDropdown.propTypes = {
    content: PropTypes.node,
    search: PropTypes.string,
    onSearch: PropTypes.func,
    placeholder: PropTypes.string
};

export default SearchDropdown;
