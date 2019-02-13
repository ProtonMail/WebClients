import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import Button from '../button/Button';
import Icon from '../icon/Icon';
import DropdownText from './DropdownText';
import { getClasses } from '../../helpers/component';

const DropdownItem = ({ type, link, text, iconName, className, onClick }) => {
    if (type === 'button') {
        return (
            <li className={getClasses('DropdownItem', className)}>
                <Button onClick={onClick}>
                    {iconName && <Icon name={iconName} />}
                    <DropdownText>{text}</DropdownText>
                </Button>
            </li>
        );
    }

    if (type === 'link') {
        return (
            <li className={getClasses('DropdownItem', className)}>
                <NavLink to={link}>
                    {iconName && <Icon name={iconName} />}
                    <DropdownText>{text}</DropdownText>
                </NavLink>
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
    link: PropTypes.string
};

DropdownItem.defaultProps = {
    type: 'link',
    className: ''
};

export default DropdownItem;