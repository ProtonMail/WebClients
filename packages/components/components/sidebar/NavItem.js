import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import Icon from '../icon/Icon';
import NavMenu from './NavMenu';
import { classnames } from '../../helpers/component';

const NavItem = ({ type = 'link', link, isActive, text, aside, onClick, icon, list = [], color, className = '' }) => {
    const content = (
        <span className="flex flex-nowrap w100 flex-items-center">
            {icon && (
                <Icon
                    name={icon}
                    color={color}
                    className="flex-item-noshrink navigation__icon mr0-5 flex-item-centered-vert"
                />
            )}
            <span className="flex-item-fluid ellipsis mw100">{text}</span>
            {aside && <span className="flex flex-items-center">{aside}</span>}
        </span>
    );

    if (type === 'link') {
        return (
            <li className="navigation__item">
                <NavLink className={classnames(['navigation__link', className])} isActive={isActive} to={link}>
                    {content}
                </NavLink>
                {list.length ? <NavMenu list={list} /> : null}
            </li>
        );
    }

    if (type === 'text') {
        return (
            <li className="navigation__item">
                <span className={classnames(['navigation__link', className])}>
                    {content}
                    {list.length ? <NavMenu list={list} /> : null}
                </span>
            </li>
        );
    }

    if (type === 'button') {
        return (
            <li className="navigation__item">
                <button type="button" className={classnames(['w100 navigation__link', className])} onClick={onClick}>
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
    text: PropTypes.node,
    aside: PropTypes.node,
    list: PropTypes.arrayOf(PropTypes.object),
    className: PropTypes.string
};

export default NavItem;
