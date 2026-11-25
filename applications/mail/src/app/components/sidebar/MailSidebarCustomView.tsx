import { useHistory } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import NewFeatureTag from '@proton/components/components/newFeatureTag/NewFeatureTag';
import SimpleSidebarListItemHeader from '@proton/components/components/sidebar/SimpleSidebarListItemHeader';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useLocalState from '@proton/components/hooks/useLocalState';
import { IcEnvelopeCheck } from '@proton/icons/icons/IcEnvelopeCheck';
import { CUSTOM_VIEWS, CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';
import noop from '@proton/utils/noop';

import { useNewsletterSubscriptions } from '../../store/newsletterSubscriptions/hook';
import { useCategoriesView } from '../categoryView/useCategoriesView';
import { BYOEInboxCleanupSpotlight } from '../view/NewsletterSubscription/Spotlight/BYOEInboxCleanupSpotlight';
import { NewsletterSubscription } from '../view/NewsletterSubscription/Spotlight/NewsletterSubscriptionSpotlight';
import { useBYOEInboxCleanupSpotlight } from '../view/NewsletterSubscription/Spotlight/useBYOEInboxCleanupSpotlight';
import { useNewsletterSubscriptionSpotlight } from '../view/NewsletterSubscription/Spotlight/useNewsletterSubscriptionSpotlight';
import SidebarItem from './SidebarItem';

interface SidebarItemProps {
    hideNotificationDot?: boolean;
    collapsed: boolean;
}

const NewsletterSubscriptionButton = ({ hideNotificationDot, collapsed }: SidebarItemProps) => {
    const history = useHistory();
    const newsletterSpotlight = useNewsletterSubscriptionSpotlight();
    const byoeSpotlight = useBYOEInboxCleanupSpotlight();

    const [newsletterSub] = useNewsletterSubscriptions();
    const { canUseCategoryView } = useCategoriesView();

    const title = canUseCategoryView
        ? c('Title').ngettext(msgid`Mailing list`, `Mailing lists`, newsletterSub.tabs.active.totalCount)
        : c('Title').t`Newsletters`;

    // Both spotlights share the item's one Spotlight; they never show together, as Mail shows one spotlight per load
    const isBYOESpotlightShown = byoeSpotlight.shouldShowSpotlight;
    const activeSpotlight = isBYOESpotlightShown ? byoeSpotlight : newsletterSpotlight;

    const openMailingLists = () => {
        byoeSpotlight.onClose();
        history.push(CUSTOM_VIEWS[CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS].route);
    };

    const handleItemClick = () => {
        newsletterSpotlight.onClose();
        // Closing it before it shows would hide it for the rest of this visit
        if (isBYOESpotlightShown) {
            byoeSpotlight.onClose();
        }
    };

    return (
        <Spotlight
            borderRadius="lg"
            innerClassName="py-3 pl-4"
            content={
                isBYOESpotlightShown ? (
                    <BYOEInboxCleanupSpotlight
                        isNewToMailingLists={byoeSpotlight.isNewToMailingLists}
                        onOpen={openMailingLists}
                    />
                ) : (
                    <NewsletterSubscription />
                )
            }
            show={activeSpotlight.shouldShowSpotlight}
            onDisplayed={activeSpotlight.onDisplayed}
            onClose={activeSpotlight.onClose}
            originalPlacement="right"
        >
            <div>
                <SidebarItem
                    collapsed={collapsed}
                    id={CUSTOM_VIEWS[CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS].id}
                    labelID={CUSTOM_VIEWS[CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS].label}
                    isFolder={false}
                    icon={IcEnvelopeCheck}
                    text={title}
                    badge={
                        isBYOESpotlightShown && byoeSpotlight.isNewToMailingLists ? (
                            <NewFeatureTag featureKey="byoe-inbox-cleanup-mailing-lists" className="text-uppercase" />
                        ) : undefined
                    }
                    moveToFolder={noop}
                    applyLabels={noop}
                    unreadCount={hideNotificationDot ? 0 : newsletterSub.tabs.active.totalCount}
                    onClickCallback={handleItemClick}
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
