import type { ReactNode, Ref } from 'react';
import { Suspense, forwardRef, lazy, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useUser } from '@proton/account/user/hooks';
import type { Breakpoints } from '@proton/components';
import { DrawerApp, PrivateAppContainer, SmartBanner, TopBanners } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import type { Recipient } from '@proton/shared/lib/interfaces';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { ADVANCED_SEARCH_OVERLAY_CLOSE_EVENT, MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose, useOnMailTo } from '../../containers/ComposeProvider';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { layoutActions } from '../../store/layout/layoutSlice';
import MailQuickSettings from '../drawer/MailQuickSettings';
import MailSidebar from '../sidebar/MailSidebar';

const LazyInboxDesktopOutdatedAppTopBanner = lazy(
    () => import('@proton/components/containers/desktop/InboxDesktopOutdatedAppTopBanner')
);

const LazyInboxDesktopDefaultAppTopBanner = lazy(
    () => import('@proton/components/containers/desktop/defaultApp/InboxDesktopDefaultAppTopBanner')
);

const LazyInboxDesktopFreeTrialTopBanner = lazy(
    () => import('@proton/components/containers/desktop/freeTrial/InboxDesktopFreeTrialTopBanner')
);

interface Props {
    children: ReactNode;
    breakpoints: Breakpoints;
    labelID: string;
    elementID: string | undefined;
}

const PrivateLayout = ({ children, labelID }: Props, ref: Ref<HTMLDivElement>) => {
    const location = useLocation();
    const dispatch = useMailDispatch();
    const onCompose = useOnCompose();
    const onMailTo = useOnMailTo();

    const [user] = useUser();

    const handleContactsCompose = async (emails: Recipient[], attachments: File[]) => {
        await onCompose({
            type: ComposeTypes.newMessage,
            action: MESSAGE_ACTIONS.NEW,
            referenceMessage: { data: { ToList: emails }, draftFlags: { initialAttachments: attachments } },
        });
    };

    useEffect(() => {
        dispatch(layoutActions.setSidebarExpanded(false));
    }, [location.pathname, location.hash]);

    const top = (
        <>
            {isElectronMail && (
                <Suspense fallback="">
                    <LazyInboxDesktopOutdatedAppTopBanner />
                    <LazyInboxDesktopDefaultAppTopBanner />
                    {!user.hasPaidMail && <LazyInboxDesktopFreeTrialTopBanner />}
                </Suspense>
            )}
            <TopBanners app={APPS.PROTONMAIL}>
                <SmartBanner app={APPS.PROTONMAIL} />
            </TopBanners>
        </>
    );

    const sidebar = <MailSidebar labelID={labelID} />;

    return (
        <PrivateAppContainer
            top={top}
            sidebar={sidebar}
            containerRef={ref}
            drawerApp={
                <DrawerApp
                    onCompose={handleContactsCompose}
                    onMailTo={onMailTo}
                    customAppSettings={<MailQuickSettings />}
                    // when catching click action from drawer close overlay
                    onContainerClick={() => {
                        document.dispatchEvent(new CustomEvent(ADVANCED_SEARCH_OVERLAY_CLOSE_EVENT));
                    }}
                />
            }
        >
            {children}
        </PrivateAppContainer>
    );
};

export default forwardRef(PrivateLayout);
