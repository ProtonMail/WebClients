import { c } from 'ttag';

import { useTheme } from '@proton/components';
import { getInboxEmptyPlaceholder } from '@proton/mail/helpers/getPlaceholderSrc';

import { EmptyViewWrapper } from '../../EmptyView/EmptyViewWrapper';

export const NewsletterSubscriptionViewPlaceholder = () => {
    const theme = useTheme();

    return (
        <EmptyViewWrapper
            imgProps={{
                src: getInboxEmptyPlaceholder({
                    size: 0,
                    theme: theme.information.theme,
                }),
            }}
            height={128}
            title={c('Title').t`No newsletters found`}
            description={c('Labels').t`You don't have any newsletters or mailing list subscriptions.`}
        />
    );
};
