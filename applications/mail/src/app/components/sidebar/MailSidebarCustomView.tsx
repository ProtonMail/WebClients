import { c } from 'ttag';

import { useActiveBreakpoint } from '@proton/components';
import { SOURCE_EVENT } from '@proton/shared/lib/helpers/collapsibleSidebar';

import { useNewsletterSubscriptions } from 'proton-mail/store/newsletterSubscriptions/hook';

import { MailSidebarCollapsedButton } from './MailSidebarCollapsedButton';
import { MailSidebarViewList } from './MailSidebarViewList';

interface Props {
    collapsed: boolean;
    onClickExpandNav?: (sourceEvent: SOURCE_EVENT) => void;
}

export const MailSidebarCustomView = ({ collapsed, onClickExpandNav }: Props) => {
    const activeBreakpoint = useActiveBreakpoint();
    const [newsletterSub] = useNewsletterSubscriptions();

    // The view is not availabe on mobile, we want to make sure to avoid showing it to users
    if (activeBreakpoint.viewportWidth['<=small']) {
        return null;
    }

    return collapsed ? (
        <MailSidebarCollapsedButton
            onClick={() => onClickExpandNav?.(SOURCE_EVENT.BUTTON_VIEWS)}
            iconName="grid-3"
            title={c('Action').t`Expand navigation bar to see custom views`}
            unread={!!newsletterSub.tabs.active.totalCount}
        />
    ) : (
        <MailSidebarViewList />
    );
};
