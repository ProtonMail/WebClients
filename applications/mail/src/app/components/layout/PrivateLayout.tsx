import { useState, useEffect, ReactNode, useCallback, forwardRef, Ref } from 'react';
import {
    PrivateAppContainer,
    NewDomainTopBanner,
    TopBanners,
    useSideApp,
    FilterRunningTopBanner,
} from '@proton/components';
import SideAppIframe from '@proton/components/components/sideApp/SideAppIframe';
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
    rightSidebarContent?: ReactNode;
}

const PrivateLayout = (
    { children, breakpoints, labelID, elementID, isBlurred, rightSidebarContent }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const { sideAppUrl } = useSideApp();
    const location = useLocation();
    const [expanded, setExpand] = useState(false);

    const handleToggleExpand = useCallback(() => setExpand((expanded) => !expanded), []);

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    const top = (
        <TopBanners>
            <NewDomainTopBanner />
            <FilterRunningTopBanner />
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

    const sideAppSidebar = rightSidebarContent && !sideAppUrl && (
        <div className="side-app-side-bar flex-column mt0-5 ml1 mr1 flex">{rightSidebarContent}</div>
    );

    const sideAppIframe = <SideAppIframe />;

    return (
        <PrivateAppContainer
            top={top}
            header={header}
            sidebar={sidebar}
            isBlurred={isBlurred}
            containerRef={ref}
            sideAppSidebar={sideAppSidebar}
            sideAppIframe={sideAppIframe}
            mainBordered={!!rightSidebarContent && !sideAppUrl}
        >
            {children}
        </PrivateAppContainer>
    );
};

export default forwardRef(PrivateLayout);
