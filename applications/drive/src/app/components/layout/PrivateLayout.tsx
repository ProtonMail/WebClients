import React, { useRef, useEffect } from 'react';
import { c } from 'ttag';
import { Sidebar, MainAreaContext, useToggle, AppsSidebar } from 'react-components';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import Header from './PrivateHeader';

const getSidebar = () => {
    return [
        {
            text: c('Link').t`Drive`,
            link: '/drive'
        }
    ];
};

const getMobileLinks = () => [
    { to: '/inbox', icon: 'protonmail', external: true, current: false },
    { to: '/contacts', icon: 'protoncontacts', external: false, current: true }
];

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
        <div className="flex flex-nowrap no-scroll">
            <AppsSidebar />
            <div className="content flex-item-fluid reset4print">
                <Header expanded={isHeaderExpanded} onToggleExpand={toggleHeaderExpanded} title={c('Title').t`Drive`} />
                <div className="flex flex-nowrap">
                    <Sidebar
                        url="/drive"
                        expanded={isHeaderExpanded}
                        onToggleExpand={toggleHeaderExpanded}
                        list={getSidebar()}
                        mobileLinks={getMobileLinks()}
                    />
                    <main ref={mainAreaRef} className="main flex-item-fluid">
                        <MainAreaContext.Provider value={mainAreaRef}>{children}</MainAreaContext.Provider>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default withRouter(PrivateLayout);
