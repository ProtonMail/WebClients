import React from 'react';
import { UserDropdown, Hamburger } from 'react-components';

interface Props {
    expanded: boolean;
    onToggleExpand: () => void;
}

// TODO: add logo to MainLogo in react-components, and remove the placeholder
const Header = ({ expanded, onToggleExpand }: Props) => {
    return (
        <header className="header flex flex-nowrap flex-spacebetween reset4print">
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            {/* <MainLogo url="/" className="nomobile" /> */}
            <img
                className="nomobile"
                src="https://mail.protonmail.com/assets/img/logo.png"
                alt="Placeholder app logo"
            />

            <UserDropdown />
        </header>
    );
};

export default Header;
