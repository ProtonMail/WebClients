import { useState, useEffect, ReactNode, useCallback, forwardRef, Ref } from 'react';
import { PrivateAppContainer, ReferralModal, TopBanners } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { useHistory, useLocation } from 'react-router-dom';
import MailHeader from '../header/MailHeader';
import MailSidebar from '../sidebar/MailSidebar';
import { getHumanLabelID } from '../../helpers/labels';
import { setKeywordInUrl } from '../../helpers/mailboxUrl';
import { Breakpoints } from '../../models/utils';

interface Props {
    children: ReactNode;
    breakpoints: Breakpoints;
    labelID: string;
    elementID: string | undefined;
    isBlurred?: boolean;
}

const PrivateLayout = ({ children, breakpoints, labelID, elementID, isBlurred }: Props, ref: Ref<HTMLDivElement>) => {
    const history = useHistory();
    const location = useLocation();
    const [expanded, setExpand] = useState(false);

    const handleSearch = useCallback((keyword = '', labelID = MAILBOX_LABEL_IDS.ALL_MAIL as string) => {
        history.push(
            setKeywordInUrl({ ...history.location, hash: '', pathname: `/${getHumanLabelID(labelID)}` }, keyword)
        );
    }, []);

    const handleToggleExpand = useCallback(() => setExpand((expanded) => !expanded), []);

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    const top = (
        <>
            <TopBanners />
            <ReferralModal />
        </>
    );

    const header = (
        <MailHeader
            labelID={labelID}
            elementID={elementID}
            breakpoints={breakpoints}
            expanded={expanded}
            onToggleExpand={handleToggleExpand}
            onSearch={handleSearch}
        />
    );

    const sidebar = (
        <MailSidebar
            labelID={labelID}
            expanded={expanded}
            onToggleExpand={handleToggleExpand}
            onSendMessage={() => setExpand(false)}
        />
    );

    return (
        <PrivateAppContainer top={top} header={header} sidebar={sidebar} isBlurred={isBlurred} containerRef={ref}>
            {children}
        </PrivateAppContainer>
    );
};

export default forwardRef(PrivateLayout);
