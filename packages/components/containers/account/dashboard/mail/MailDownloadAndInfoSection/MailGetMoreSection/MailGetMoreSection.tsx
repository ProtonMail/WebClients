import { c } from 'ttag';

import MailLogo from '@proton/components/components/logo/MailLogo';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import type { Subscription } from '@proton/payments';
import { PLANS, PLAN_NAMES, hasFree } from '@proton/payments';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getBlogURL } from '@proton/shared/lib/helpers/url';

import {
    type DashboardMoreInfoSection,
    DashboardMoreInfoSectionTag,
    DashboardMoreInfoSections,
} from '../../../shared/DashboardMoreInfoSection/DashboardMoreInfoSection';
import businessCommunication from './illustrations/business-communication.svg';
import filters from './illustrations/filters.svg';
import manageInbox from './illustrations/manage-inbox.svg';
import manageSubscription from './illustrations/manage-subscriptions.svg';

interface Props {
    subscription: Subscription | undefined;
}

export const MailGetMoreSection = ({ subscription }: Props) => {
    const isFreeSubscription = hasFree(subscription);
    const sections: DashboardMoreInfoSection[] = [
        {
            title: () => c('Blog').t`See and manage all your email subscriptions`,
            description: () => getBoldFormattedText(c('Blog').t`Try out **Newsletters view** to declutter your inbox.`),
            image: manageSubscription,
            link: 'https://mail.proton.me/views/newsletters',
        },
        {
            title: () =>
                isFreeSubscription
                    ? c('Blog').t`Easily manage your inbox with Mail Plus`
                    : c('Blog').t`Easily manage your inbox`,
            tag: (
                <DashboardMoreInfoSectionTag
                    key="watch-shows-label"
                    prefix={<MailLogo variant="glyph-only" size={5} />}
                    text={PLAN_NAMES[PLANS.MAIL]}
                />
            ),
            description: () =>
                isFreeSubscription
                    ? c('Blog')
                          .t`Discover our tips for effectively managing your inbox so you can stay productive and focused.`
                    : getBoldFormattedText(
                          c('Blog')
                              .t`**Auto-delete**, **snooze**, and **email scheduling** are included in your subscription.`
                      ),
            image: manageInbox,
            link: getBlogURL('/email-management'),
        },
        {
            title: () => c('Blog').t`Protect your business communications`,
            tag: (
                <DashboardMoreInfoSectionTag
                    key="sensitive-data-label"
                    prefix={<MailLogo variant="glyph-only" size={5} />}
                    text={PLAN_NAMES[PLANS.MAIL_BUSINESS]}
                />
            ),
            description: () =>
                c('Blog')
                    .t`Working with sensitive data? Use ${MAIL_APP_NAME} to protect your communications and build trust with clients.`,
            image: businessCommunication,
            link: 'https://proton.me/business/mail',
        },
        {
            title: () => c('Blog').t`Get a clean inbox with filters`,
            tag: <DashboardMoreInfoSectionTag key="advanced-label" text={c('Label').t`Advanced`} />,
            description: () => c('Blog').t`Automate recurring actions to sort and organize incoming emails.`,
            image: filters,
            link: 'https://proton.me/support/email-inbox-filters',
        },
    ];

    return <DashboardMoreInfoSections sections={sections} />;
};

export default MailGetMoreSection;
