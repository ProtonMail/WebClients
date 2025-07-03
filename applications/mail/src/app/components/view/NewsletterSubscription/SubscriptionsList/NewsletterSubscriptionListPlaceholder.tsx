import { c } from 'ttag';

import { useTheme } from '@proton/components';
import { getInboxEmptyPlaceholder } from '@proton/mail/helpers/getPlaceholderSrc';

import { useMailSelector } from 'proton-mail/store/hooks';
import { SubscriptionTabs } from 'proton-mail/store/newsletterSubscriptions/interface';
import { selectedTab } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { EmptyViewWrapper } from '../../EmptyView/EmptyViewWrapper';

export const NewsletterSubscriptionListPlaceholder = () => {
    const theme = useTheme();
    const tabSelected = useMailSelector(selectedTab);

    return (
        <EmptyViewWrapper
            imgProps={{
                src: getInboxEmptyPlaceholder({
                    size: 0,
                    theme: theme.information.theme,
                }),
            }}
            height={128}
            title={
                tabSelected === SubscriptionTabs.Active
                    ? c('Title').t`No active newsletters`
                    : c('Title').t`No unsubscribed newsletters`
            }
            description={
                tabSelected === SubscriptionTabs.Active
                    ? c('Labels').t`You don't have any active newsletters or mailing list subscriptions.`
                    : c('Labels').t`Newsletters or mailing lists you unsubscribe from will show up here.`
            }
        />
    );
};
