import { c } from 'ttag';

import { useTheme } from '@proton/components';
import { getInboxEmptyPlaceholder } from '@proton/mail/helpers/getPlaceholderSrc';

import { useMailSelector } from 'proton-mail/store/hooks';
import { selectedTab } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { EmptyViewWrapper } from '../../EmptyView/EmptyViewWrapper';

export const NewsletterSubscriptionListPlaceholder = () => {
    const theme = useTheme();
    const tabSelected = useMailSelector(selectedTab);

    return (
        <EmptyViewWrapper
            imgProps={{
                src: getInboxEmptyPlaceholder({
                    size: tabSelected === 'active' ? 0 : 100,
                    theme: theme.information.theme,
                }),
            }}
            height={128}
            title={
                tabSelected === 'active'
                    ? c('Title').t`No mail subscriptions`
                    : c('Title').t`No unsubscribed mail subscriptions`
            }
            description={
                tabSelected === 'active'
                    ? c('Labels').t`View and manage newsletter and mailing list subscriptions here.`
                    : c('Labels').t`Newsletters you unsubscribe from will appear here.`
            }
        />
    );
};
