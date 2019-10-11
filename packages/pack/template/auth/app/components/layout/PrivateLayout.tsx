import React, { useRef, useState, useEffect } from 'react';
import { c } from 'ttag';
import { Sidebar, Icons, MainAreaContext } from 'react-components';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import Header from './PrivateHeader';

const getSidebar = () => {
    return [
        {
            text: c('Link').t`Home`,
            link: '/'
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
    const mainAreaRef = useRef<HTMLElement>();
    const [isHeaderExpanded, setHeaderExpanded] = useState(false);

    useEffect(() => {
        setHeaderExpanded(false);
        mainAreaRef.current.scrollTop = 0;
    }, [location.pathname]);

    const toggleExpand = () => setHeaderExpanded(!isHeaderExpanded);

    return (
        <>
            <Header expanded={isHeaderExpanded} onToggleExpand={toggleExpand} />
            <div className="flex flex-nowrap">
                <Sidebar list={getSidebar()} />
                <main ref={mainAreaRef} className="main flex-item-fluid main-area main-area-content">
                    <MainAreaContext.Provider value={mainAreaRef}>{children}</MainAreaContext.Provider>
                </main>
            </div>
            <Icons />
        </>
    );
};

export default withRouter(PrivateLayout);
