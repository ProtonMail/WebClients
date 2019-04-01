import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import Button from '../button/Button';
import Icon from '../icon/Icon';

const DropdownItem = ({ type, link, text, iconName, className, onClick, disabled }) => {
    if (type === 'button') {
        return (
            <li className={`DropdownItem ${className}`}>
                <Button onClick={onClick} disabled={disabled}>
                    {iconName && <Icon name={iconName} />}
                    {text}
                </Button>
            </li>
        );
    }

    if (type === 'link') {
        return (
            <li className={`DropdownItem ${className}`}>
                <NavLink to={link}>
                    {iconName && <Icon name={iconName} />}
                    {text}
                </NavLink>
            </li>
        );
    }

    if (type === 'text') {
        return (
            <li className={`DropdownItem ${className}`}>
                {iconName && <Icon name={iconName} />}
                {text}
            </li>
        );
    }

    return null;
};

DropdownItem.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func,
    type: PropTypes.string.isRequired,
    iconName: PropTypes.string,
    text: PropTypes.string.isRequired,
    link: PropTypes.string,
    disabled: PropTypes.bool
};

DropdownItem.defaultProps = {
    type: 'text',
    className: ''
};

export default DropdownItem;
