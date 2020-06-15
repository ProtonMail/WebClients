import React, { useEffect } from 'react';
import { c } from 'ttag';
import { Sidebar, useToggle, PrivateAppContainer } from 'react-components';
import Header from './PrivateHeader';
import UploadButton from '../uploads/UploadButton';
import TransfersInfo from '../TransfersInfo/TransfersInfo';

const getSidebar = () => {
    return [
        {
            text: c('Link').t`My files`,
            link: '/drive',
            icon: 'inbox'
        },
        {
            text: c('Link').t`Trash`,
            link: '/drive/trash',
            icon: 'trash'
        }
    ];
};

interface Props {
    children: React.ReactNode;
}

const PrivateLayout = ({ children }: Props) => {
    const { state: isHeaderExpanded, toggle: toggleHeaderExpanded, set: setExpand } = useToggle();

    useEffect(() => {
        setExpand(false);
    }, [window.location.pathname]);

    const header = (
        <Header expanded={isHeaderExpanded} onToggleExpand={toggleHeaderExpanded} title={c('Title').t`Drive`} />
    );

    const sidebar = (
        <Sidebar url="/drive" expanded={isHeaderExpanded} onToggleExpand={toggleHeaderExpanded} list={getSidebar()}>
            <UploadButton />
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
