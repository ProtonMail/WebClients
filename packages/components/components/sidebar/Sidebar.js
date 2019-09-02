import React from 'react';
import PropTypes from 'prop-types';

import NavMenu from './NavMenu';
import MainLogo from '../logo/MainLogo';

const Sidebar = ({ list = [], url = '/account' }) => {
    return (
        <div className="sidebar flex flex-column noprint">
            <MainLogo url={url} className="nodesktop notablet" />
            <nav className="navigation mw100 flex-item-fluid scroll-if-needed mb1">
                <NavMenu list={list} />
            </nav>
        </div>
    );
};

Sidebar.propTypes = {
    list: PropTypes.arrayOf(PropTypes.object),
    url: PropTypes.string.isRequired
};

export default Sidebar;
