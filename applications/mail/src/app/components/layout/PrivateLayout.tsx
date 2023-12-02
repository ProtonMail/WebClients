import { ReactNode, Ref, forwardRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { Breakpoints, DrawerApp, PrivateAppContainer, TopBanners } from '@proton/components';
import { Recipient } from '@proton/shared/lib/interfaces';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose, useOnMailTo } from '../../containers/ComposeProvider';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { layoutActions } from '../../logic/layout/layoutSlice';
import { useAppDispatch } from '../../logic/store';
import MailQuickSettings from '../drawer/MailQuickSettings';
import MailSidebar from '../sidebar/MailSidebar';

interface Props {
    children: ReactNode;
    breakpoints: Breakpoints;
    labelID: string;
    elementID: string | undefined;
}

const PrivateLayout = ({ children, labelID }: Props, ref: Ref<HTMLDivElement>) => {
    const location = useLocation();
    const dispatch = useAppDispatch();
    const onCompose = useOnCompose();
    const onMailTo = useOnMailTo();

    const handleContactsCompose = (emails: Recipient[], attachments: File[]) => {
        onCompose({
            type: ComposeTypes.newMessage,
            action: MESSAGE_ACTIONS.NEW,
            referenceMessage: { data: { ToList: emails }, draftFlags: { initialAttachments: attachments } },
        });
    };

    useEffect(() => {
        dispatch(layoutActions.setSidebarExpanded(false));
    }, [location.pathname, location.hash]);

    const top = <TopBanners />;

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
                />
            }
        >
            {children}
        </PrivateAppContainer>
    );
};

export default forwardRef(PrivateLayout);
