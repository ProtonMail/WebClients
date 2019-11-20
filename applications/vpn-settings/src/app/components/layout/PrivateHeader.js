import React from 'react';
import PropTypes from 'prop-types';
import { MainLogo, TopNavbar, Hamburger, BlackFridayNavbarLink, VPNBlackFridayModal } from 'react-components';

const PrivateHeader = ({ location, expanded, onToggleExpand }) => {
    return (
        <header className="header flex flex-nowrap reset4print">
            <MainLogo url="/account" className="nomobile" />
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
