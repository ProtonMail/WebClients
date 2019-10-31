import React, { useRef, useEffect } from 'react';
import { c } from 'ttag';
import { Sidebar, Icons, MainAreaContext, useToggle } from 'react-components';
import { withRouter, RouteComponentProps, match } from 'react-router-dom';
import Header from './PrivateHeader';

const getSidebar = () => {
    return [
        {
            text: c('Link').t`Home`,
            link: '/',
            isActive: (m: match) => !!m && m.isExact
        },
        {
            text: c('Link').t`About`,
            link: '/about'
        }
    ];
};

interface Props extends RouteComponentProps {
    children: React.ReactNode;
}

const PrivateLayout = ({ children, location }: Props) => {
    const mainAreaRef = useRef<HTMLElement>(null);
    const { state: isHeaderExpanded, toggle: toggleHeaderExpanded, set: setHeaderExpanded } = useToggle();

    useEffect(() => {
        setHeaderExpanded(false);
        if (mainAreaRef.current) {
            mainAreaRef.current.scrollTop = 0;
        }
    }, [location.pathname]);

    return (
        <>
            <Header expanded={isHeaderExpanded} onToggleExpand={toggleHeaderExpanded} />
            <div className="flex flex-nowrap">
                <Sidebar expanded={isHeaderExpanded} onToggleExpand={toggleHeaderExpanded} list={getSidebar()} />
                <main ref={mainAreaRef} className="main flex-item-fluid main-area main-area-content">
                    <MainAreaContext.Provider value={mainAreaRef}>{children}</MainAreaContext.Provider>
                </main>
            </div>
            <Icons />
        </>
    );
};

export default withRouter(PrivateLayout);
