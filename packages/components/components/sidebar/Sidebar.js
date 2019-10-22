import React from 'react';
import PropTypes from 'prop-types';

import NavMenu from './NavMenu';
import MobileNavServices from './MobileNavServices';
import MobileNavLink from './MobileNavLink';
import MainLogo from '../logo/MainLogo';
import Hamburger from './Hamburger';

const Sidebar = ({ expanded = false, onToggleExpand, list = [], url = '', mobileLinks = [], children }) => {
    return (
        <div className="sidebar flex flex-column noprint" data-expanded={expanded}>
            <div className="nodesktop notablet flex-item-noshrink">
                <div className="flex flex-spacebetween flex-items-center">
                    <MainLogo url={url} />
                    <Hamburger expanded={expanded} onToggle={onToggleExpand} />
                </div>
            </div>
            {children}
            <nav className="navigation mw100 flex-item-fluid scroll-if-needed mb1">
                <NavMenu list={list} />
            </nav>
            {mobileLinks.length ? (
                <MobileNavServices>
                    {mobileLinks.map(({ to, icon, external, current }) => {
                        return <MobileNavLink key={icon} to={to} icon={icon} external={external} current={current} />;
                    })}
                </MobileNavServices>
            ) : null}
        </div>
    );
};

Sidebar.propTypes = {
    list: PropTypes.arrayOf(PropTypes.object),
    mobileLinks: PropTypes.arrayOf(PropTypes.object),
    url: PropTypes.string.isRequired,
    expanded: PropTypes.bool,
    onToggleExpand: PropTypes.func,
    children: PropTypes.node
};

export default Sidebar;
