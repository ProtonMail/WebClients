import React from 'react';
import { MainLogo, TopNavbar, Hamburger, useActiveBreakpoint, SupportDropdown, AppsDropdown } from 'react-components';

interface Props {
    expanded: boolean;
    onToggleExpand: () => void;
    title: string;
}

const Header = ({ expanded, onToggleExpand, title }: Props) => {
    const { isNarrow } = useActiveBreakpoint();

    return (
        <header className="header flex flex-items-center flex-nowrap reset4print">
            <div className="logo-container flex flex-spacebetween flex-items-center flex-nowrap nomobile">
                <MainLogo url="/drive" />
                <AppsDropdown />
            </div>
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            {title && isNarrow ? <span className="h3 mb0 ellipsis lh-standard">{title}</span> : null}
            <TopNavbar>
                <SupportDropdown />
            </TopNavbar>
        </header>
    );
};

export default Header;
