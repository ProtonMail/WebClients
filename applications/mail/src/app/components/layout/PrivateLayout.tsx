import { MutableRefObject, ReactElement, ReactNode, Ref, forwardRef, useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { DrawerApp, DrawerSidebar, PrivateAppContainer, TopBanners } from '@proton/components';
import DrawerVisibilityButton from '@proton/components/components/drawer/DrawerVisibilityButton';
import { Recipient } from '@proton/shared/lib/interfaces';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose, useOnMailTo } from '../../containers/ComposeProvider';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { Breakpoints } from '../../models/utils';
import MailHeader from '../header/MailHeader';
import MailSidebar from '../sidebar/MailSidebar';

interface Props {
    children: ReactNode;
    breakpoints: Breakpoints;
    labelID: string;
    elementID: string | undefined;
    drawerSidebarButtons: ReactElement[];
    drawerSpotlightSeenRef: MutableRefObject<boolean>;
    showDrawerSidebar?: boolean;
}

const PrivateLayout = (
    {
        children,
        breakpoints,
        labelID,
        elementID,
        drawerSidebarButtons,
        drawerSpotlightSeenRef,
        showDrawerSidebar,
    }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const location = useLocation();
    const [expanded, setExpand] = useState(false);
    const onCompose = useOnCompose();
    const onMailTo = useOnMailTo();

    const handleToggleExpand = useCallback(() => setExpand((expanded) => !expanded), []);

    const handleContactsCompose = (emails: Recipient[], attachments: File[]) => {
        onCompose({
            type: ComposeTypes.newMessage,
            action: MESSAGE_ACTIONS.NEW,
            referenceMessage: { data: { ToList: emails }, draftFlags: { initialAttachments: attachments } },
        });
    };

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    const top = <TopBanners />;

    const header = (
        <MailHeader
            labelID={labelID}
            elementID={elementID}
            breakpoints={breakpoints}
            expanded={expanded}
            onToggleExpand={handleToggleExpand}
        />
    );

    const sidebar = <MailSidebar labelID={labelID} expanded={expanded} onToggleExpand={handleToggleExpand} />;

    const canShowDrawer = drawerSidebarButtons.length > 0;

    return (
        <PrivateAppContainer
            top={top}
            header={header}
            sidebar={sidebar}
            containerRef={ref}
            drawerSidebar={<DrawerSidebar buttons={drawerSidebarButtons} spotlightSeenRef={drawerSpotlightSeenRef} />}
            drawerVisibilityButton={
                canShowDrawer ? <DrawerVisibilityButton spotlightSeenRef={drawerSpotlightSeenRef} /> : undefined
            }
            drawerApp={<DrawerApp onCompose={handleContactsCompose} onMailTo={onMailTo} />}
            mainBordered={canShowDrawer && showDrawerSidebar}
        >
            {children}
        </PrivateAppContainer>
    );
};

export default forwardRef(PrivateLayout);
