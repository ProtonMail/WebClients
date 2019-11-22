import React from 'react';
import { c } from 'ttag';
import { Sidebar, AppsSidebar, useToggle } from 'react-components';
import Header from './PrivateHeader';

const getSidebar = () => {
    return [
        {
            text: c('Link').t`My files`,
            link: '/drive',
            icon: 'inbox'
        }
    ];
};

const getMobileLinks = () => [
    { to: '/inbox', icon: 'protonmail', external: true, current: false },
    { to: '/contacts', icon: 'protoncontacts', external: false, current: true }
];

interface Props {
    children: React.ReactNode;
}

const PrivateLayout = ({ children }: Props) => {
    const { state: isHeaderExpanded, toggle: toggleHeaderExpanded } = useToggle();

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
                    <main className="main flex-item-fluid">{children}</main>
                </div>
            </div>
        </div>
    );
};

export default PrivateLayout;
