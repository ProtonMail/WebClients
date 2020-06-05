import React from 'react';
import { c } from 'ttag';
import { Sidebar, useToggle, useDelinquent } from 'react-components';
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
    const { state: isHeaderExpanded, toggle: toggleHeaderExpanded } = useToggle();
    useDelinquent();

    return (
        <div className="flex flex-nowrap no-scroll">
            <div className="content flex-item-fluid reset4print">
                <Header expanded={isHeaderExpanded} onToggleExpand={toggleHeaderExpanded} title={c('Title').t`Drive`} />
                <div className="flex flex-nowrap">
                    <Sidebar
                        url="/drive"
                        expanded={isHeaderExpanded}
                        onToggleExpand={toggleHeaderExpanded}
                        list={getSidebar()}
                    >
                        <UploadButton />
                    </Sidebar>
                    <main className="main flex-item-fluid">
                        {children}
                        <TransfersInfo />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default PrivateLayout;
