import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { c } from 'ttag';
import { AppsSidebar, StorageSpaceStatus, MainAreaContext, Href } from 'react-components';
import { normalize } from 'proton-shared/lib/helpers/string';

import PrivateHeader from '../header/PrivateHeader';
import PrivateSidebar from '../sidebar/PrivateSidebar';
import { Location, History } from 'history';
import { OnCompose } from '../../containers/ComposerContainer';

interface Props {
    children: ReactNode;
    location: Location;
    history: History;
    labelID: string;
    onCompose: OnCompose;
}

const PrivateLayout = ({ children, location, history, labelID, onCompose }: Props) => {
    const mainAreaRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpand] = useState(false);

    const handleSearch = (keyword: string) => {
        console.log(normalize(keyword));
    };

    useEffect(() => {
        setExpand(false);
    }, [location.pathname]);

    return (
        <div className="flex flex-nowrap no-scroll">
            <AppsSidebar
                items={[
                    <StorageSpaceStatus
                        key="storage"
                        upgradeButton={
                            <Href
                                url="/settings/subscription"
                                target="_self"
                                className="pm-button pm-button--primary pm-button--small"
                            >
                                {c('Action').t`Upgrade`}
                            </Href>
                        }
                    ></StorageSpaceStatus>
                ]}
            />
            <div className="content flex-item-fluid reset4print">
                <PrivateHeader
                    location={location}
                    history={history}
                    expanded={expanded}
                    onToggleExpand={() => setExpand(!expanded)}
                    onSearch={handleSearch}
                />
                <div className="flex flex-nowrap">
                    <PrivateSidebar labelID={labelID} expanded={expanded} location={location} onCompose={onCompose} />
                    <div className="main flex-item-fluid scroll-smooth-touch" ref={mainAreaRef}>
                        <div className="flex-item-fluid">
                            <MainAreaContext.Provider value={mainAreaRef}>{children}</MainAreaContext.Provider>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivateLayout;
