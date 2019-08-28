import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import Icon from '../icon/Icon';
import NavMenu from './NavMenu';

const NavItem = ({ type = 'link', link, isActive, text, onClick, icon, list = [], color, className = '' }) => {
    const content = (
        <span className="flex flex-nowrap flex-items-center">
            {icon && (
                <Icon
                    name={icon}
                    color={color}
                    className="flex-item-noshrink navigation__icon mr0-5 flex-item-centered-vert"
                />
            )}
            <span className="ellipsis mw100">{text}</span>
        </span>
    );

    if (type === 'link') {
        return (
            <li className="navigation__item">
                <NavLink className={`navigation__link ${className}`} isActive={isActive} to={link}>
                    {content}
                </NavLink>
                {list.length ? <NavMenu list={list} /> : null}
            </li>
        );
    }

    if (type === 'text') {
        return (
            <li className="navigation__item">
                <span className={`navigation__link ${className}`}>
                    {content}
                    {list.length ? <NavMenu list={list} /> : null}
                </span>
            </li>
        );
    }

    if (type === 'button') {
        return (
            <li className="navigation__item">
                <button type="button" className={`w100 navigation__link ${className}`} onClick={onClick}>
                    {content}
                </button>
                {list.length ? <NavMenu list={list} /> : null}
            </li>
        );
    }

    return null;
};

NavItem.propTypes = {
    isActive: PropTypes.func,
    icon: PropTypes.string,
    color: PropTypes.string,
    onClick: PropTypes.func,
    type: PropTypes.oneOf(['link', 'button', 'text']),
    link: PropTypes.string,
    text: PropTypes.string,
    list: PropTypes.arrayOf(PropTypes.object),
    className: PropTypes.string
};

export default NavItem;
