import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { MainAreaContext, TopBanners } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import PrivateHeader from '../header/PrivateHeader';
import PrivateSidebar from '../sidebar/PrivateSidebar';
import { Location, History } from 'history';
import { OnCompose } from '../../containers/ComposerContainer';
import { getHumanLabelID } from '../../helpers/labels';
import { setKeywordInUrl } from '../../helpers/mailboxUrl';
import { Breakpoints } from '../../models/utils';

interface Props {
    children: ReactNode;
    location: Location;
    history: History;
    breakpoints: Breakpoints;
    labelID: string;
    elementID: string | undefined;
    onCompose: OnCompose;
}

const PrivateLayout = ({ children, location, history, breakpoints, labelID, elementID, onCompose }: Props) => {
    const mainAreaRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpand] = useState(false);

    const handleSearch = (keyword = '', labelID = MAILBOX_LABEL_IDS.ALL_MAIL as string) => {
        history.push(setKeywordInUrl({ ...location, pathname: `/${getHumanLabelID(labelID)}` }, keyword));
    };

    const handleToggleExpand = () => setExpand(!expanded);

    useEffect(() => {
        setExpand(false);
    }, [location.pathname]);

    return (
        <div className="flex flex-column flex-nowrap no-scroll">
            <TopBanners />
            <div className="content flex-item-fluid-auto reset4print">
                <PrivateHeader
                    labelID={labelID}
                    elementID={elementID}
                    location={location}
                    history={history}
                    breakpoints={breakpoints}
                    expanded={expanded}
                    onToggleExpand={handleToggleExpand}
                    onSearch={handleSearch}
                />
                <div className="flex flex-nowrap">
                    <PrivateSidebar
                        labelID={labelID}
                        expanded={expanded}
                        location={location}
                        onToggleExpand={handleToggleExpand}
                        breakpoints={breakpoints}
                        onCompose={onCompose}
                    />
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
