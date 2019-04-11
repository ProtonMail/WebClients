import React from 'react';
import PropTypes from 'prop-types';

import NavMenu from './NavMenu';

const Sidebar = ({ list }) => {
    return (
        <div className="sidebar flex noprint">
            <nav className="navigation flex-item-fluid scroll-if-needed mb1">
                <NavMenu list={list} />
            </nav>
        </div>
    );
};

Sidebar.propTypes = {
    list: PropTypes.arrayOf(PropTypes.object)
};

Sidebar.defaultProps = {
    list: []
};

export default Sidebar;
