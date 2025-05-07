import { c } from 'ttag';

import { useTheme } from '@proton/components';
import { getInboxEmptyPlaceholder } from '@proton/mail/helpers/getPlaceholderSrc';

import { EmptyViewWrapper } from '../../EmptyView/EmptyViewWrapper';

export const NewsletterSubscriptionListPlaceholder = () => {
    const theme = useTheme();

    return (
        <EmptyViewWrapper
            imgProps={{ src: getInboxEmptyPlaceholder({ size: 0, theme: theme.information.theme }) }}
            height={128}
            title={c('Title').t`No mail subscriptions`}
            description={c('Labels').t`View and manage newsletter and mailing list subscriptions here.`}
        />
    );
};
