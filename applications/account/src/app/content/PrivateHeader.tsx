import React from 'react';
import { MainLogo, TopNavbar, Hamburger, useActiveBreakpoint, AppsDropdown } from 'react-components';

interface Props {
    title: string;
    expanded: boolean;
    onToggleExpand: () => void;
}

const PrivateHeader = ({ title, expanded, onToggleExpand }: Props) => {
    const { isNarrow } = useActiveBreakpoint();

    return (
        <header className="header flex flex-items-center flex-nowrap reset4print">
            <div className="logo-container flex flex-spacebetween flex-items-center flex-nowrap nomobile">
                <MainLogo url="/settings" external={true} />
                <AppsDropdown />
            </div>
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            {title && isNarrow ? <span className="h3 mb0 ellipsis lh-standard">{title}</span> : null}
            <TopNavbar />
        </header>
    );
};

export default PrivateHeader;
