import React from 'react';
import { MainLogo, TopNavbar, Hamburger, useActiveBreakpoint } from 'react-components';

interface Props {
    title: string;
    expanded: boolean;
    onToggleExpand: () => void;
}

const PrivateHeader = ({ title, expanded, onToggleExpand }: Props) => {
    const { isNarrow } = useActiveBreakpoint();

    return (
        <header className="header flex flex-items-center flex-nowrap reset4print">
            <MainLogo url="/settings" className="nomobile" external={true} />
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            {title && isNarrow ? <span className="h3 mb0 ellipsis lh-standard">{title}</span> : null}
            <TopNavbar />
        </header>
    );
};

export default PrivateHeader;
