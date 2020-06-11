import React from 'react';
import {
    MainLogo,
    TopNavbar,
    Hamburger,
    BlackFridayNavbarLink,
    VPNBlackFridayModal,
    AppsDropdown
} from 'react-components';
import * as H from 'history';

interface Props {
    location: H.Location;
    expanded: boolean;
    onToggleExpand: () => void;
}

const PrivateHeader = ({ location, expanded, onToggleExpand }: Props) => {
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
                    getModal={({ plans, onSelect }: any) => <VPNBlackFridayModal plans={plans} onSelect={onSelect} />}
                />
            </TopNavbar>
        </header>
    );
};

export default PrivateHeader;
