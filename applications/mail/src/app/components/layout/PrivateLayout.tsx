import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { c } from 'ttag';
import { AppsSidebar, StorageSpaceStatus, MainAreaContext, Href, useDelinquent } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import PrivateHeader from '../header/PrivateHeader';
import PrivateSidebar from '../sidebar/PrivateSidebar';
import { Location, History } from 'history';
import { OnCompose } from '../../containers/ComposerContainer';
import { getHumanLabelID } from '../../helpers/labels';
import { setKeywordInUrl } from '../../helpers/mailboxUrl';

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
    useDelinquent();

    const handleSearch = (keyword = '', labelID = MAILBOX_LABEL_IDS.ALL_MAIL) => {
        history.push(setKeywordInUrl({ ...location, pathname: `/${getHumanLabelID(labelID)}` }, keyword));
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
                    labelID={labelID}
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
