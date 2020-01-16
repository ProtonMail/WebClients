import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import Icon from '../icon/Icon';
import NavMenu from './NavMenu';
import { classnames } from '../../helpers/component';

const NavItem = ({
    type = 'link',
    ariaHiddenList,
    ariaCurrent,
    link,
    isActive,
    text,
    aside,
    onClick,
    icon,
    list = [],
    color,
    className = '',
    itemClassName = 'navigation__item',
    linkClassName = 'navigation__link'
}) => {
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
            <li className={itemClassName}>
                <NavLink
                    className={classnames([linkClassName, className])}
                    isActive={isActive}
                    to={link}
                    aria-current={ariaCurrent}
                >
                    {content}
                </NavLink>
                {list.length ? (
                    <NavMenu ariaHidden={ariaHiddenList} list={list} listClassName="nomobile navigation__sublist" />
                ) : null}
            </li>
        );
    }

    if (type === 'text') {
        return (
            <li className={itemClassName}>
                <span className={classnames([linkClassName, className])}>
                    {content}
                    {list.length ? (
                        <NavMenu ariaHidden={ariaHiddenList} list={list} listClassName="nomobile navigation__sublist" />
                    ) : null}
                </span>
            </li>
        );
    }

    if (type === 'button') {
        return (
            <li className={itemClassName}>
                <button type="button" className={classnames(['w100', linkClassName, className])} onClick={onClick}>
                    {content}
                </button>
                {list.length ? (
                    <NavMenu ariaHidden={ariaHiddenList} list={list} listClassName="nomobile navigation__sublist" />
                ) : null}
            </li>
        );
    }

    return null;
};

NavItem.propTypes = {
    ariaCurrent: PropTypes.string,
    ariaHiddenList: PropTypes.bool,
    linkClassName: PropTypes.string,
    itemClassName: PropTypes.string,
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
