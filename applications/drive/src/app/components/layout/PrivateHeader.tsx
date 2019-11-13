import React from 'react';
import { MainLogo, TopNavbar, Hamburger, useActiveBreakpoint, SupportDropdown } from 'react-components';

interface Props {
    expanded: boolean;
    onToggleExpand: () => void;
    title: string;
}

const Header = ({ expanded, onToggleExpand, title }: Props) => {
    const { isNarrow } = useActiveBreakpoint();

    return (
        <header className="header flex flex-items-center flex-nowrap reset4print">
            <MainLogo url="/drive" className="nomobile" />
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            {title && isNarrow ? <span className="h3 mb0 ellipsis lh-standard">{title}</span> : null}
            <TopNavbar>
                <SupportDropdown />
            </TopNavbar>
        </header>
    );
};

export default Header;
