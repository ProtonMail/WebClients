import type { ReactNode, Ref } from 'react';
import { Suspense, forwardRef, lazy, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { DrawerApp, FeatureTour, PrivateAppContainer, SmartBanner, TopBanners } from '@proton/components';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import type { Recipient } from '@proton/shared/lib/interfaces';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { selectLayoutIsExpanded } from 'proton-mail/store/layout/layoutSliceSelectors';

import { ADVANCED_SEARCH_OVERLAY_CLOSE_EVENT } from '../../constants';
import { useOnCompose, useOnMailTo } from '../../containers/ComposeProvider';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { layoutActions } from '../../store/layout/layoutSlice';
import MailQuickSettings from '../drawer/MailQuickSettings';
import MailSidebar from '../sidebar/MailSidebar';

const LazyInboxDesktopMailTop = lazy(() => import('@proton/components/containers/desktop/InboxDesktopMailTop'));

interface Props {
    children: ReactNode;
    labelID: string;
}

const PrivateLayout = ({ children, labelID }: Props, ref: Ref<HTMLDivElement>) => {
    const location = useLocation();
    const dispatch = useMailDispatch();
    const onCompose = useOnCompose();
    const onMailTo = useOnMailTo();
    const isSidebarExpanded = useMailSelector(selectLayoutIsExpanded);

    const handleContactsCompose = async (emails: Recipient[], attachments: File[]) => {
        await onCompose({
            type: ComposeTypes.newMessage,
            action: MESSAGE_ACTIONS.NEW,
            referenceMessage: { data: { ToList: emails }, draftFlags: { initialAttachments: attachments } },
        });
    };

    useEffect(() => {
        if (isSidebarExpanded) {
            dispatch(layoutActions.setSidebarExpanded(false));
        }
    }, [location.pathname, location.hash]);

    const top = (
        <>
            {isElectronMail && (
                <Suspense fallback="">
                    <LazyInboxDesktopMailTop />
                </Suspense>
            )}
            <TopBanners app={APPS.PROTONMAIL}>
                <SmartBanner app={APPS.PROTONMAIL} />
            </TopBanners>
        </>
    );

    return (
        <PrivateAppContainer
            top={top}
            sidebar={<MailSidebar labelID={labelID} />}
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
            <FeatureTour />
            {children}
        </PrivateAppContainer>
    );
};

export default forwardRef(PrivateLayout);
