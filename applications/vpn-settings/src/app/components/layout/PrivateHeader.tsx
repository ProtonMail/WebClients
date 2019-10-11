import React from 'react';
import { MainLogo, SupportDropdown, TopNavbar, Hamburger } from 'react-components';

interface Props extends React.HTMLProps<HTMLElement> {
    expanded?: boolean;
    onToggleExpand: () => void;
}

const PrivateHeader = ({ expanded, onToggleExpand }: Props) => {
    return (
        <header className="header flex flex-nowrap reset4print">
            <MainLogo url="/account" className="nomobile" />
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            <div className="searchbox-container nomobile" />
            <TopNavbar>
                <SupportDropdown />
            </TopNavbar>
        </header>
    );
};

export default PrivateHeader;
