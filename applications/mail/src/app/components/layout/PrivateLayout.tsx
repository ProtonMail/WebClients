import { useState, useEffect, ReactNode, useCallback, forwardRef, Ref } from 'react';
import { PrivateAppContainer, NewDomainTopBanner, TopBanners } from '@proton/components';
import { useLocation } from 'react-router-dom';
import MailHeader from '../header/MailHeader';
import MailSidebar from '../sidebar/MailSidebar';
import { Breakpoints } from '../../models/utils';

interface Props {
    children: ReactNode;
    breakpoints: Breakpoints;
    labelID: string;
    elementID: string | undefined;
    isBlurred?: boolean;
}

const PrivateLayout = ({ children, breakpoints, labelID, elementID, isBlurred }: Props, ref: Ref<HTMLDivElement>) => {
    const location = useLocation();
    const [expanded, setExpand] = useState(false);

    const handleToggleExpand = useCallback(() => setExpand((expanded) => !expanded), []);

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    const top = (
        <TopBanners>
            <NewDomainTopBanner />
        </TopBanners>
    );

    const header = (
        <MailHeader
            labelID={labelID}
            elementID={elementID}
            breakpoints={breakpoints}
            expanded={expanded}
            onToggleExpand={handleToggleExpand}
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
