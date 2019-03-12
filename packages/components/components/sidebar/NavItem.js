import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import Button from '../button/Button';
import Icon from '../icon/Icon';
import NavMenu from './NavMenu';

const NavItem = ({ type, link, text, onClick, iconName, list }) => {
    if (type === 'link') {
        return (
            <li className="navigation__item">
                <NavLink className="navigation__link" to={link}>
                    {iconName && <Icon name={iconName} />}
                    {text}
                </NavLink>
                {list.length ? <NavMenu list={list} /> : null}
            </li>
        );
    }

    if (type === 'text') {
        return (
            <li className="navigation__item">
                <span className="navigation__link">
                    {iconName && <Icon name={iconName} />}
                    {text}
                    {list.length ? <NavMenu list={list} /> : null}
                </span>
            </li>
        );
    }

    if (type === 'button') {
        return (
            <li className="navigation__item">
                <Button className="w100" onClick={onClick}>
                    {iconName && <Icon name={iconName} />}
                    {text}
                </Button>
                {list.length ? <NavMenu list={list} /> : null}
            </li>
        );
    }

    return null;
};

NavItem.propTypes = {
    iconName: PropTypes.string,
    onClick: PropTypes.func,
    type: PropTypes.oneOf(['link', 'button', 'text']),
    link: PropTypes.string,
    text: PropTypes.string,
    list: PropTypes.arrayOf(PropTypes.object)
};

NavItem.defaultProps = {
    type: 'link',
    list: []
};

export default NavItem;
