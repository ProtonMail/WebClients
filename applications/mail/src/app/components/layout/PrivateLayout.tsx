import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { PrivateAppContainer } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { Location, History } from 'history';

import MailHeader from '../header/MailHeader';
import MailSidebar from '../sidebar/MailSidebar';
import { getHumanLabelID } from '../../helpers/labels';
import { setKeywordInUrl } from '../../helpers/mailboxUrl';
import { Breakpoints } from '../../models/utils';
import { OnCompose } from '../../hooks/useCompose';

interface Props {
    children: ReactNode;
    location: Location;
    history: History;
    breakpoints: Breakpoints;
    labelID: string;
    elementID: string | undefined;
    onCompose: OnCompose;
    isBlurred?: boolean;
}

const PrivateLayout = ({
    children,
    location,
    history,
    breakpoints,
    labelID,
    elementID,
    onCompose,
    isBlurred,
}: Props) => {
    const [expanded, setExpand] = useState(false);

    const handleSearch = useCallback((keyword = '', labelID = MAILBOX_LABEL_IDS.ALL_MAIL as string) => {
        history.push(setKeywordInUrl({ ...location, pathname: `/${getHumanLabelID(labelID)}` }, keyword));
    }, []);

    const handleToggleExpand = useCallback(() => setExpand((expanded) => !expanded), []);

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    const header = (
        <MailHeader
            labelID={labelID}
            elementID={elementID}
            location={location}
            history={history}
            breakpoints={breakpoints}
            expanded={expanded}
            onToggleExpand={handleToggleExpand}
            onSearch={handleSearch}
            onCompose={onCompose}
        />
    );

    const sidebar = (
        <MailSidebar
            labelID={labelID}
            expanded={expanded}
            location={location}
            onToggleExpand={handleToggleExpand}
            onCompose={onCompose}
        />
    );

    return (
        <PrivateAppContainer header={header} sidebar={sidebar} isBlurred={isBlurred}>
            {children}
        </PrivateAppContainer>
    );
};

export default PrivateLayout;
