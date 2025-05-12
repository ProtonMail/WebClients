import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { SimpleSidebarListItemHeader, Spotlight, useLocalState } from '@proton/components';
import { CUSTOM_VIEWS, CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';
import useFlag from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';
import { useNewsletterSubscriptions } from 'proton-mail/store/newsletterSubscriptions/hook';

import { NewsletterSubscription } from '../view/NewsletterSubscription/Spotlight/NewsletterSubscriptionSpotlight';
import { useNewsletterSubscriptionSpotlight } from '../view/NewsletterSubscription/Spotlight/useNewsletterSubscriptionSpotlight';
import SidebarItem from './SidebarItem';

export const MailSidebarViewList = () => {
    const newsletterSubscriptionView = useFlag('NewsletterSubscriptionView');
    const spotlight = useNewsletterSubscriptionSpotlight();

    const [{ counts }] = useNewsletterSubscriptions();

    const [user] = useUser();
    const [displayView, toggleView] = useLocalState(newsletterSubscriptionView, `${user.ID || 'item'}-display-views`);

    const mailParams = useMailSelector(params);

    // We need this because there is only one view for the moment
    if (!newsletterSubscriptionView) {
        return null;
    }

    return (
        <>
            <SimpleSidebarListItemHeader
                toggle={displayView}
                onToggle={(value) => toggleView(value)}
                text={c('Link').t`Views`}
                title={c('Link').t`Views`}
                id="toggle-folders"
                spaceAbove
            />
            {displayView && (
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
                            id={CUSTOM_VIEWS[CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS].id}
                            labelID={CUSTOM_VIEWS[CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS].label}
                            currentLabelID={mailParams.labelID}
                            isFolder={false}
                            icon="envelope-check"
                            text={c('Label').t`Mail subscriptions`}
                            moveToFolder={noop}
                            applyLabels={noop}
                            unreadCount={counts?.active}
                            onClickCallback={() => spotlight.onClose()}
                            hideCountOnHover={false}
                            hideSpinner
                        />
                    </div>
                </Spotlight>
            )}
        </>
    );
};
