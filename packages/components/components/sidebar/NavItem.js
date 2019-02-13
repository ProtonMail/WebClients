import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import Button from '../button/Button';
import NavText from './NavText';
import NavIcon from './NavIcon';
import NavMenu from './NavMenu';

const NavItem = ({ type, link, text, onClick, iconClassName, list }) => {
    if (type === 'link') {
        return (
            <li className="navigation__item">
                <NavLink className="navigation__link" to={link}>
                    {iconClassName && <NavIcon className={iconClassName} />}
                    <NavText>{text}</NavText>
                </NavLink>
                {list.length ? <NavMenu list={list} /> : null}
            </li>
        );
    }

    if (type === 'text') {
        return (
            <li className="navigation__item">
                <span className="navigation__link">
                    {iconClassName && <NavIcon className={iconClassName} />}
                    <NavText>{text}</NavText>
                    {list.length ? <NavMenu list={list} /> : null}
                </span>
            </li>
        );
    }

    if (type === 'button') {
        return (
            <li className="navigation__item">
                <Button className="w100" onClick={onClick}>
                    {iconClassName && <NavIcon className={iconClassName} />}
                    <NavText>{text}</NavText>
                </Button>
                {list.length ? <NavMenu list={list} /> : null}
            </li>
        );
    }

    return null;
};

NavItem.propTypes = {
    type: PropTypes.string.isRequired,
    iconClassName: PropTypes.string,
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