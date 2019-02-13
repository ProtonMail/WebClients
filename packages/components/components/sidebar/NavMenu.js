import React from 'react';
import PropTypes from 'prop-types';

import NavItem from './NavItem';

const NavMenu = ({ list }) => {
    return (
        <ul className="navigation__list unstyled">
            {list.map((item, index) => <NavItem {...item} key={item.text + index}></NavItem>)}
        </ul>
    );
};

NavMenu.propTypes = {
    list: PropTypes.arrayOf(PropTypes.object)
};

NavMenu.defaultProps = {
    list: []
};

export default NavMenu;