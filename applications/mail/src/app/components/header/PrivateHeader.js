import React from 'react';
import PropTypes from 'prop-types';
import {
    MainLogo,
    SupportDropdown,
    Hamburger,
    TopNavbar,
    TopNavbarLink,
    UpgradeButton,
    useUser
} from 'react-components';
import { c } from 'ttag';

import SearchBar from './SearchBar';

const PrivateHeader = ({ location, expanded, onToggleExpand, onSearch }) => {
    const [{ hasPaidMail }] = useUser();
    return (
        <header className="header flex flex-nowrap reset4print">
            <MainLogo url="/inbox" className="nomobile" />
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            <SearchBar placeholder={c('Placeholder').t`Search messages`} location={location} onSearch={onSearch} />
            <TopNavbar>
                {hasPaidMail ? null : <UpgradeButton external={true} />}
                <TopNavbarLink to="/inbox" icon="mailbox" text={c('Title').t`Mailbox`} aria-current={true} />
                <TopNavbarLink external={true} to="/settings" icon="settings-master" text={c('Title').t`Settings`} />
                <SupportDropdown />
            </TopNavbar>
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
