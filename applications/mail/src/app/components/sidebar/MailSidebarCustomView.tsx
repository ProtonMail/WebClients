import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { SimpleSidebarListItemHeader, Spotlight, useActiveBreakpoint, useLocalState } from '@proton/components';
import { CUSTOM_VIEWS, CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';
import noop from '@proton/utils/noop';

import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';
import { useNewsletterSubscriptions } from 'proton-mail/store/newsletterSubscriptions/hook';

import { NewsletterSubscription } from '../view/NewsletterSubscription/Spotlight/NewsletterSubscriptionSpotlight';
import { useNewsletterSubscriptionSpotlight } from '../view/NewsletterSubscription/Spotlight/useNewsletterSubscriptionSpotlight';
import SidebarItem from './SidebarItem';

interface SidebarItemProps {
    hideNotificationDot?: boolean;
    collapsed: boolean;
}

const NewsletterSubscriptionButton = ({ hideNotificationDot, collapsed }: SidebarItemProps) => {
    const mailParams = useMailSelector(params);
    const spotlight = useNewsletterSubscriptionSpotlight();

    const [newsletterSub] = useNewsletterSubscriptions();

    return (
        <Spotlight
            borderRadius="lg"
            innerClassName="py-3 pl-4"
            content={<NewsletterSubscription />}
            show={spotlight.shouldShowSpotlight}
            onDisplayed={spotlight.onDisplayed}
            onClose={spotlight.onClose}
            originalPlacement="right"
        >
            <div>
                <SidebarItem
                    collapsed={collapsed}
                    id={CUSTOM_VIEWS[CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS].id}
                    labelID={CUSTOM_VIEWS[CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS].label}
                    currentLabelID={mailParams.labelID}
                    isFolder={false}
                    icon="envelope-check"
                    text={c('Label').t`Newsletters`}
                    moveToFolder={noop}
                    applyLabels={noop}
                    unreadCount={hideNotificationDot ? 0 : newsletterSub.tabs.active.totalCount}
                    onClickCallback={() => spotlight.onClose()}
                    hideCountOnHover={false}
                    hideSpinner
                />
            </div>
        </Spotlight>
    );
};

interface Props {
    collapsed: boolean;
}

export const MailSidebarCustomView = ({ collapsed }: Props) => {
    const activeBreakpoint = useActiveBreakpoint();

    const [user] = useUser();
    const [displayView, toggleView] = useLocalState(true, `${user.ID || 'item'}-display-views`);

    // The view is not availabe on mobile, we want to make sure to avoid showing it to users
    if (activeBreakpoint.viewportWidth['<=small']) {
        return null;
    }

    if (collapsed) {
        return <NewsletterSubscriptionButton collapsed={collapsed} hideNotificationDot />;
    }

    return (
        <>
            <SimpleSidebarListItemHeader
                toggle={displayView}
                onToggle={(value) => toggleView(value)}
                text={c('Link').t`Views`}
                title={c('Link').t`Views`}
                id="toggle-views"
                spaceAbove
            />
            {displayView && (
                <NewsletterSubscriptionButton
                    collapsed={collapsed}
                    // The counter currently shows the number of active subscription
                    // We decided to hide it as there's no way to clear that counter
                    // as users will want to keep active subscriptions.
                    // We can undo this once we bring the counter and clearing method
                    // closer to how the other locations work.
                    hideNotificationDot
                />
            )}
        </>
    );
};
