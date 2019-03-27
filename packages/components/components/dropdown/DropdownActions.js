import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-components';
import { c } from 'ttag';

import Dropdown from './Dropdown';
import DropdownMenu from './DropdownMenu';

const DropdownActions = ({ list, content, className }) => {
    if (!list.length) {
        return null;
    }

    if (list.length === 1) {
        const [{ text, ...rest }] = list;
        return (
            <Button className={className} {...rest}>
                {text}
            </Button>
        );
    }

    return (
        <Dropdown content={content} className={className}>
            <DropdownMenu list={list} />
        </Dropdown>
    );
};

DropdownActions.propTypes = {
    list: PropTypes.array.isRequired,
    className: PropTypes.string,
    content: PropTypes.string
};

DropdownActions.defaultProps = {
    list: [],
    className: '',
    content: c('Action').t`Options`
};

export default DropdownActions;
