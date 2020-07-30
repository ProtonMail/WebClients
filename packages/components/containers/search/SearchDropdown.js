import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    SearchInput,
    DropdownButton,
    Dropdown,
    Icon,
    usePopperAnchor,
    PrimaryButton,
    ResetButton,
} from 'react-components';
import { c } from 'ttag';

import { generateUID } from '../../helpers/component';

const SearchDropdown = ({
    search: initialSearch = '',
    onSearch,
    placeholder = c('Placeholder').t`Search`,
    content = <Icon name="search" />,
    originalPlacement,
    ...rest
}) => {
    const [uid] = useState(generateUID('search-dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();
    const [search, updateSearch] = useState(initialSearch);

    useEffect(() => updateSearch(initialSearch), [initialSearch]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSearch(search);
        close();
    };

    const handleReset = (event) => {
        event.preventDefault();
        updateSearch('');
        onSearch('');
        close();
    };

    return (
        <>
            <DropdownButton {...rest} buttonRef={anchorRef} isOpen={isOpen} onClick={toggle}>
                {content}
            </DropdownButton>
            <Dropdown
                id={uid}
                autoClose={false}
                originalPlacement={originalPlacement}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
            >
                <form className="p1" name="search-dropdown" onSubmit={handleSubmit}>
                    <div className="mb1">
                        <SearchInput
                            autoFocus
                            delay={0}
                            value={search}
                            onChange={(newValue) => updateSearch(newValue)}
                            placeholder={placeholder}
                        />
                    </div>
                    <div className="flex flex-nowrap">
                        <ResetButton disabled={!search} className="w50" onClick={handleReset}>{c('Action')
                            .t`Clear`}</ResetButton>
                        <PrimaryButton className="w50 ml1" type="submit">{c('Action').t`Search`}</PrimaryButton>
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
    originalPlacement: PropTypes.string,
    placeholder: PropTypes.string,
};

export default SearchDropdown;
