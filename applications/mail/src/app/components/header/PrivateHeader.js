import React from 'react';
import PropTypes from 'prop-types';
import { MainLogo, SupportDropdown, UserDropdown, Hamburger } from 'react-components';

const PrivateHeader = ({ expanded, onToggleExpand }) => {
    return (
        <header className="header flex flex-nowrap reset4print">
            <MainLogo url="/inbox" className="nomobile" />
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            <div className="searchbox-container nomobile"></div>
            <div className="topnav-container flex-item-centered-vert flex-item-fluid">
                <ul className="topnav-list unstyled mt0 mb0 ml1 flex flex-nowrap">
                    <li className="mr1 nomobile">
                        <SupportDropdown className="topnav-link inline-flex flex-nowrap nodecoration rounded" />
                    </li>
                    <li className="mlauto mtauto mbauto relative flex-item-noshrink">
                        <UserDropdown />
                    </li>
                </ul>
            </div>
        </header>
    );
};

PrivateHeader.propTypes = {
    expanded: PropTypes.bool,
    onToggleExpand: PropTypes.func
};

export default PrivateHeader;
