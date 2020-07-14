import React, { useEffect } from 'react';
import { c } from 'ttag';
import {
    Sidebar,
    useToggle,
    PrivateAppContainer,
    PrivateHeader,
    useActiveBreakpoint,
    SidebarList,
    SidebarNav,
    SimpleSidebarListItemLink
} from 'react-components';
import { match as Match } from 'react-router-dom';
import { Location } from 'history';
import UploadButton from '../uploads/UploadButton';
import TransfersInfo from '../TransfersInfo/TransfersInfo';
import DriveSidebarVersion from './DriveSidebarVersion';

const getSidebarList = () => {
    return [
        {
            text: c('Link').t`My files`,
            to: '/drive',
            isActive: (match: Match<any>, location: Location) =>
                !!match && (match.isExact || !location.pathname.includes('trash')),
            icon: 'inbox'
        },
        {
            text: c('Link').t`Trash`,
            to: '/drive/trash',
            icon: 'trash'
        }
    ];
};

interface Props {
    children: React.ReactNode;
}

const PrivateLayout = ({ children }: Props) => {
    const { state: isHeaderExpanded, toggle: toggleHeaderExpanded, set: setExpand } = useToggle();
    const { isNarrow } = useActiveBreakpoint();

    useEffect(() => {
        setExpand(false);
    }, [window.location.pathname]);

    const base = '/drive';
    const header = (
        <PrivateHeader
            url={base}
            title={c('Title').t`Drive`}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            isNarrow={isNarrow}
            floatingButton={<UploadButton floating />}
        />
    );

    const sidebar = (
        <Sidebar
            url={base}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            primary={<UploadButton />}
            version={<DriveSidebarVersion />}
        >
            <SidebarNav>
                <SidebarList>
                    {getSidebarList().map(({ text, to, isActive, icon }) => {
                        return (
                            <SimpleSidebarListItemLink key={to} to={to} isActive={isActive} icon={icon}>
                                {text}
                            </SimpleSidebarListItemLink>
                        );
                    })}
                </SidebarList>
            </SidebarNav>
        </Sidebar>
    );

    return (
        <PrivateAppContainer header={header} sidebar={sidebar}>
            {children}
            <TransfersInfo />
        </PrivateAppContainer>
    );
};

export default PrivateLayout;
