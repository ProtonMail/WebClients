import React from 'react';
import { c } from 'ttag';
import { Sidebar, AppsSidebar, useToggle, StorageSpaceStatus, Href, useDelinquent } from 'react-components';
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
            link: '/trash',
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
            <AppsSidebar
                items={[
                    <StorageSpaceStatus
                        key="storage"
                        upgradeButton={
                            <Href url="/settings/subscription" target="_self" className="pm-button pm-button--primary">
                                {c('Action').t`Upgrade`}
                            </Href>
                        }
                    />
                ]}
            />
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
