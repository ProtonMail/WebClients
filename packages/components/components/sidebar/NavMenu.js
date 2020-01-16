import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

import NavItem from './NavItem';

const NavMenu = ({ className, listClassName = 'navigation__list', list = [{}], ariaHidden }) => {
    return (
        <ul className={classnames(['unstyled', listClassName, className])} aria-hidden={ariaHidden}>
            {list.map((item, index) => (
                <NavItem {...item} key={`${index}`} />
            ))}
        </ul>
    );
};

NavMenu.propTypes = {
    ariaHidden: PropTypes.bool,
    listClassName: PropTypes.string,
    className: PropTypes.string,
    list: PropTypes.arrayOf(PropTypes.object)
};

export default NavMenu;
