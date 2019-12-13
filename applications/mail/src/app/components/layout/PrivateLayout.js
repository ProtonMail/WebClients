import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Route } from 'react-router-dom';
import { AppsSidebar, StorageSpaceStatus, MainAreaContext, Href } from 'react-components';
import { normalize } from 'proton-shared/lib/helpers/string';

import PrivateHeader from '../header/PrivateHeader';
import PrivateSidebar from '../sidebar/PrivateSidebar';

const PrivateLayout = ({ children, location, history, labelID }) => {
    const mainAreaRef = useRef();
    const [expanded, setExpand] = useState(false);

    const handleSearch = (keyword) => {
        console.log(normalize(keyword));
    };

    useEffect(() => {
        setExpand(false);
    }, [location.pathname]);

    return (
        <div className="flex flex-nowrap no-scroll">
            <AppsSidebar
                items={[
                    <StorageSpaceStatus key="storage" upgradeButton={<div />}>
                        <Href
                            url="/settings/subscription"
                            target="_self"
                            className="pm-button pm-button--primary pm-button--small"
                        >
                            {c('Action').t`Upgrade`}
                        </Href>
                    </StorageSpaceStatus>
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
                    <Route path="/:path" render={() => <PrivateSidebar labelID={labelID} expanded={expanded} />} />
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

PrivateLayout.propTypes = {
    children: PropTypes.node.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    labelID: PropTypes.string.isRequired
};

export default PrivateLayout;
