import { c } from 'ttag';

import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { getInboxEmptyPlaceholder } from '@proton/mail/helpers/getPlaceholderSrc';

import { EmptyViewWrapper } from '../../EmptyView/EmptyViewWrapper';

export const NewsletterSubscriptionViewPlaceholder = ({ loading }: { loading: boolean }) => {
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
            title={loading ? c('Title').t`Loading...` : c('Title').t`No newsletters found`}
            description={
                loading
                    ? c('Labels').t`Loading your newsletter subscriptions...`
                    : c('Labels').t`You don't have any newsletters or mailing list subscriptions.`
            }
        />
    );
};
