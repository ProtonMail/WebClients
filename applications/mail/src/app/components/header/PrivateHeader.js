import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { MainLogo, SupportDropdown, Icon, Href, UserDropdown, Hamburger } from 'react-components';
import { c } from 'ttag';
import SearchBar from './SearchBar';

const PrivateHeader = ({ location, expanded, onToggleExpand, onSearch }) => {
    return (
        <header className="header flex flex-nowrap reset4print">
            <MainLogo url="/inbox" className="nomobile" />
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            <SearchBar location={location} onSearch={onSearch} />
            <div className="topnav-container flex-item-centered-vert flex-item-fluid">
                <ul className="topnav-list unstyled mt0 mb0 ml1 flex flex-nowrap">
                    <li className="mr1 flex-item-noshrink">
                        <Link
                            to="/inbox"
                            className="topnav-link inline-flex flex-nowrap nodecoration rounded"
                            aria-current="true"
                        >
                            <Icon
                                name="mailbox"
                                className="flex-item-noshrink topnav-icon mr0-5 flex-item-centered-vert fill-white"
                            />
                            <span className="navigation-title topnav-linkText">{c('Link').t`Mailbox`}</span>
                        </Link>
                    </li>
                    <li className="mr1 flex-item-noshrink">
                        <Href
                            url="/settings"
                            target="_self"
                            className="topnav-link inline-flex flex-nowrap nodecoration rounded"
                        >
                            <Icon
                                name="settings"
                                className="flex-item-noshrink topnav-icon mr0-5 flex-item-centered-vert fill-white"
                            />
                            <span className="navigation-title topnav-linkText">{c('Link').t`Settings`}</span>
                        </Href>
                    </li>
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
    location: PropTypes.object.isRequired,
    onSearch: PropTypes.func.isRequired,
    expanded: PropTypes.bool,
    onToggleExpand: PropTypes.func.isRequired
};

export default PrivateHeader;
