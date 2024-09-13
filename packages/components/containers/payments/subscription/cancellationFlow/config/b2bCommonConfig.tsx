import { differenceInDays, format, fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { Href } from '@proton/atoms';
import { BRAND_NAME, MAIL_APP_NAME, PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl, getStaticURL } from '@proton/shared/lib/helpers/url';
import type { SubscriptionModel } from '@proton/shared/lib/interfaces';
import compliance from '@proton/styles/assets/img/cancellation-flow/testimonial_compliance.svg';
import connected from '@proton/styles/assets/img/cancellation-flow/testimonial_connceted.svg';
import standOut from '@proton/styles/assets/img/cancellation-flow/testimonial_stand_out.svg';

import type { ConfirmationModal, PlanConfigFeatures, PlanConfigTestimonial } from '../interface';

export const getDefaultTestimonial = (planName: string): PlanConfigTestimonial => {
    return {
        title: c('Subscription reminder').t`All you need for your business`,
        description: c('Subscription reminder')
            .t`Your ${planName} plan doesn’t just keep your business data and communications safe. It supports your compliance objectives, makes your business stand out, and keeps your team connected.`,
        testimonials: [
            {
                title: c('Subscription reminder').t`Support your compliance objectives`,
                description: c('Subscription reminder')
                    .t`${MAIL_APP_NAME} keeps your business data secure and lets you send encrypted emails to anyone.`,
                ctaText: c('Subscription reminder').t`Learn more`,
                link: getStaticURL('/support/password-protected-emails'),
                picture: compliance,
            },
            {
                title: c('Subscription reminder').t`Make your business stand out`,
                description: c('Subscription reminder')
                    .t`Build trust and brand recognition with professional email addresses at your own domain.`,
                ctaText: c('Subscription reminder').t`Learn more`,
                link: getStaticURL('/support/custom-domain'),
                picture: standOut,
            },
            {
                title: c('Subscription reminder').t`Stay secure and connected anywhere`,
                description: c('Subscription reminder')
                    .t`Keep your team secure on the go with our apps for web, iOS, Android, Windows, Mac, and Linux.`,
                ctaText: c('Subscription reminder').t`Learn more`,
                link: getStaticURL('/mail/download'),
                picture: connected,
            },
        ],
    };
};

export const getDefaultFeatures = (
    planName: string,
    planMaxSpace: string,
    maxEmails: number,
    maxDomainNames: number
): PlanConfigFeatures => {
    return {
        title: c('Subscription reminder').t`Email productivity features`,
        description: c('Subscription reminder')
            .t`${planName} gives your team what they need to be more productive, organized, and in control of their inbox, schedule, and more.`,
        features: [
            {
                icon: 'storage',
                text: c('Subscription reminder').t`${planMaxSpace} storage per user`,
            },
            {
                icon: 'envelopes',
                text: c('Subscription reminder').ngettext(
                    msgid`${maxEmails} email address per user`,
                    `${maxEmails} email addresses per user`,
                    maxEmails
                ),
            },
            {
                icon: 'folders',
                text: c('Subscription reminder').t`Unlimited folders and labels`,
            },
            {
                icon: 'globe',
                text: c('Subscription reminder').ngettext(
                    msgid`${maxDomainNames} custom email domain`,
                    `${maxDomainNames} custom email domains`,
                    maxDomainNames
                ),
            },
            {
                icon: 'envelope-arrow-up-and-right',
                text: c('Subscription reminder').t`Automatic email forwarding`,
            },
            {
                icon: 'calendar-grid',
                text: c('Subscription reminder').t`25 calendars per user`,
            },
            {
                icon: 'calendar-checkmark',
                text: c('Subscription reminder').t`See your colleagues’ availability`,
            },
            {
                icon: 'at',
                text: c('Subscription reminder').t`Catch-all email address`,
            },
            {
                icon: 'tv',
                text: c('Subscription reminder').t`Desktop app and email client support (via IMAP)`,
            },
            {
                icon: 'shield-half-filled',
                text: c('Subscription reminder').t`${PROTON_SENTINEL_NAME} program`,
            },
            {
                icon: 'life-ring',
                text: c('Subscription reminder').t`Priority support`,
            },
        ],
    };
};

export const ExpirationTime = ({
    subscription,
    isChargeBeeUser,
}: {
    subscription: SubscriptionModel;
    isChargeBeeUser?: boolean;
}) => {
    const latestSubscription = subscription.UpcomingSubscription?.PeriodEnd ?? subscription.PeriodEnd;

    if (isChargeBeeUser) {
        const endDate = fromUnixTime(latestSubscription);
        const formattedEndDate = format(fromUnixTime(latestSubscription), 'PP');
        return (
            <time className="text-bold" dateTime={format(endDate, 'yyyy-MM-dd')}>
                {formattedEndDate}
            </time>
        );
    } else {
        const endSubDate = fromUnixTime(latestSubscription);
        const dayDiff = differenceInDays(endSubDate, new Date());
        return (
            <strong>
                <time dateTime={format(endSubDate, 'yyyy-MM-dd')}>
                    {c('Subscription reminder').ngettext(msgid`${dayDiff} day left`, `${dayDiff} days left`, dayDiff)}
                </time>
            </strong>
        );
    }
};

export const getDefaultConfirmationModal = (
    subscription: SubscriptionModel,
    planName: string,
    isChargeBeeUser?: boolean
): ConfirmationModal => {
    const expiryDate = <ExpirationTime subscription={subscription} isChargeBeeUser={isChargeBeeUser} />;

    const learnMoreLink = (
        <Href className="mb-8" href={getKnowledgeBaseUrl('/free-plan-limits')}>
            {c('Link').t`Learn more`}
        </Href>
    );

    const description = isChargeBeeUser
        ? c('Subscription reminder')
              .jt`Your ${planName} subscription ends on ${expiryDate}. After that, you'll be on the ${BRAND_NAME} Free plan. If your usage exceeds free plan limits, you may experience restricted access to product features and your data. ${learnMoreLink}`
        : c('Subscription reminder')
              .jt`You still have ${expiryDate} on your ${planName} subscription. We'll add the credits for the remaining time to your ${BRAND_NAME} Account. Make sure you do not exceed the free plan limits before canceling. ${learnMoreLink}`;

    return {
        description,
        warningTitle: c('Subscription reminder')
            .t`Organizations, additional users, and custom email domains are not supported on the free plan. This means:`,
        warningPoints: [
            c('Subscription reminder').t`Invited members will be removed from your organization`,
            c('Subscription reminder').t`Users won’t be able to send emails`,
            c('Subscription reminder').t`Users won’t be able to manage their calendars`,
            c('Subscription reminder').t`Users won’t be able to sync files on their devices`,
            c('Subscription reminder').t`Any custom email domains will be disabled`,
        ],
    };
};

export const getDefaultGBStorageWarning = (planName: string, planMaxSpace: string, isChargeBeeUser?: boolean) => {
    const warning = isChargeBeeUser
        ? c('Subscription reminder')
              .t`After your ${planName} subscription expires, you will be downgraded to ${BRAND_NAME} Free, which only offers up to 1 GB of Mail storage and up to 5 GB of Drive storage. Your team will experience interruptions in their work since additional users are not supported on the free plan.`
        : c('Subscription reminder')
              .t`When you cancel ${planName}, you will be downgraded to ${BRAND_NAME} Free, which only offers up to 1 GB of Mail storage and up to 5 GB of Drive storage. Your team will experience interruptions in their work since additional users are not supported on the free plan.`;

    return {
        warning,
        title: c('Subscription reminder').t`Extra storage and users`,
        description: c('Subscription reminder')
            .t`${planName} offers ${planMaxSpace} storage per user for emails, attachments, events, and files. You are also eligible for yearly storage bonuses.`,
    };
};

export const getDefaultReminder = (planName: string) => {
    return {
        title: c('Subscription reminder').t`What you give up when you cancel ${planName}`,
    };
};
