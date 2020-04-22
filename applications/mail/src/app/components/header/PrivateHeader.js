import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    MainLogo,
    SupportDropdown,
    Hamburger,
    TopNavbar,
    TopNavbarLink,
    UpgradeButton,
    Searchbox,
    useUser
} from 'react-components';
import { c } from 'ttag';

import AdvancedSearchDropdown from './AdvancedSearchDropdown';
import { extractSearchParameters } from '../../helpers/mailboxUrl';

const PrivateHeader = ({ labelID, location, history, expanded, onToggleExpand, onSearch }) => {
    const [{ hasPaidMail }] = useUser();
    const { keyword = '' } = extractSearchParameters(location);
    const [value, updateValue] = useState(keyword);

    return (
        <header className="header flex flex-nowrap reset4print">
            <MainLogo url="/inbox" className="nomobile" />
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            <Searchbox
                delay={0}
                placeholder={c('Placeholder').t`Search messages`}
                onSearch={(keyword) => onSearch(keyword, keyword ? undefined : labelID)}
                onChange={updateValue}
                value={value}
                advanced={
                    <AdvancedSearchDropdown labelID={labelID} keyword={value} location={location} history={history} />
                }
            />
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
    labelID: PropTypes.string.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    onSearch: PropTypes.func.isRequired,
    expanded: PropTypes.bool,
    onToggleExpand: PropTypes.func.isRequired
};

export default PrivateHeader;
