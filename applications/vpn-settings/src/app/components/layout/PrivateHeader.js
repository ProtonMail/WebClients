import React from 'react';
import PropTypes from 'prop-types';
import {
    MainLogo,
    TopNavbar,
    Hamburger,
    BlackFridayNavbarLink,
    VPNBlackFridayModal,
    AppsDropdown
} from 'react-components';

const PrivateHeader = ({ location, expanded, onToggleExpand }) => {
    return (
        <header className="header flex flex-nowrap reset4print">
            <div className="logo-container flex flex-spacebetween flex-items-center flex-nowrap nomobile">
                <MainLogo url="/account" />
                <span hidden>
                    <AppsDropdown />
                </span>
            </div>
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            <div className="searchbox-container nomobile" />
            <TopNavbar>
                <BlackFridayNavbarLink
                    to="/dashboard"
                    location={location}
                    getModal={({ plans, onSelect }) => <VPNBlackFridayModal plans={plans} onSelect={onSelect} />}
                />
            </TopNavbar>
        </header>
    );
};

PrivateHeader.propTypes = {
    expanded: PropTypes.bool,
    onToggleExpand: PropTypes.func,
    location: PropTypes.shape({
        pathname: PropTypes.string
    })
};

export default PrivateHeader;
