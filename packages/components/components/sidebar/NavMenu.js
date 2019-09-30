import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

import NavItem from './NavItem';

const NavMenu = ({ className, list = [{}] }) => {
    return (
        <ul className={classnames(['navigation__list unstyled', className])}>
            {list.map((item, index) => (
                <NavItem {...item} key={`${index}`} />
            ))}
        </ul>
    );
};

NavMenu.propTypes = {
    className: PropTypes.string,
    list: PropTypes.arrayOf(PropTypes.object)
};

export default NavMenu;
