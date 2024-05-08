import { differenceInDays, format, fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { SubscriptionModel } from '@proton/shared/lib/interfaces';
import alias from '@proton/styles/assets/img/cancellation-flow/testimonial_alias.png';
import darkWeb from '@proton/styles/assets/img/cancellation-flow/testimonial_dark_web.png';
import netShield from '@proton/styles/assets/img/cancellation-flow/testimonial_net_shield.png';

import { ConfirmationModal, PlanConfigTestimonial } from '../interface';

export const getDefaultTestimonial = (): PlanConfigTestimonial => {
    return {
        title: c('Subscription reminder').t`Direct contribution to our mission`,
        description: c('Subscription reminder')
            .t`${BRAND_NAME}'s only source of revenue is user subscriptions. Your support allows us to remain independent, advance our mission to make privacy the default online, and continue supporting activists and organizations fighting for privacy and freedom.`,
        learMoreLink: 'https://proton.me/about/impact',
        learnMoreCTA: c('Subscription reminder').t`Learn more about our impact`,
        testimonials: [
            {
                title: c('Subscription reminder').t`Our fight against censorship in Russia`,
                description: c('Subscription reminder')
                    .t`How we fought back when ${BRAND_NAME} was targeted in an aggressive censorship campaign.`,
                ctaText: c('Subscription reminder').t`Read the story`,
                link: 'https://www.nytimes.com/2022/12/06/technology/russia-internet-proton-vpn.html',
                picture: darkWeb,
            },
            {
                title: c('Subscription reminder').t`Helping activists in Hong Kong`,
                description: c('Subscription reminder')
                    .t`How we supported local activists when privacy and free speech were threatened in Hong Kong.`,
                ctaText: c('Subscription reminder').t`Watch the interview`,
                link: 'https://www.youtube.com/watch?v=QmFTporQpM8',
                picture: netShield,
            },
            {
                title: c('Subscription reminder').t`Unblocking internet access in Iran`,
                description: c('Subscription reminder')
                    .t`How our customer support team got our VPN app directly into people's hands. `,
                ctaText: c('Subscription reminder').t`Read the story`,
                link: 'https://www.pcmag.com/opinions/proton-vpns-new-stealth-feature-helps-fight-censorship-in-iran-and-russia',
                picture: alias,
            },
        ],
    };
};

export const getDefaultConfirmationModal = (subscription: SubscriptionModel, planName: string): ConfirmationModal => {
    const latestSubscription = subscription.UpcomingSubscription?.PeriodEnd ?? subscription.PeriodEnd;
    const endSubDate = fromUnixTime(latestSubscription);
    const dayDiff = differenceInDays(endSubDate, new Date());
    const expiryDate = (
        <strong>
            <time dateTime={format(endSubDate, 'yyyy-MM-dd')}>
                {c('Subscription reminder').ngettext(msgid`${dayDiff} day left`, `${dayDiff} days left`, dayDiff)}
            </time>
        </strong>
    );

    const learnMoreLink = (
        <Href className="mb-8" href={getKnowledgeBaseUrl('/free-plan-limits')}>
            {c('Link').t`Learn more`}
        </Href>
    );

    return {
        description: c('Subscription reminder')
            .jt`You still have ${expiryDate} on your ${planName} subscription. We'll add the credits for the remaining time to your ${BRAND_NAME} Account. Make sure you do not exceed the free plan limits before canceling. ${learnMoreLink}`,
        warningTitle: c('Subscription reminder')
            .t`If you exceed the free plan limits when your ${planName} subscription expires, you will not be able to:`,
        warningPoints: [
            c('Subscription reminder').t`Receive new emails`,
            c('Subscription reminder').t`Send emails with attachments`,
            c('Subscription reminder').t`Manage your calendar`,
            c('Subscription reminder').t`Sync files on devices`,
            c('Subscription reminder').t`Add any new files`,
            c('Subscription reminder').t`Back up photos from your devices`,
        ],
    };
};

export const getDefaultGBStorageWarning = (planName: string, planMaxSpace: string) => {
    return {
        title: c('Subscription reminder').t`Extra storage and bonuses`,
        description: c('Subscription reminder')
            .t`${planName} offers ${planMaxSpace} storage for your emails, attachments, events, passwords, and files. You are also eligible for yearly storage bonuses.`,
        warning: c('Subscription reminder')
            .t`When you cancel ${planName}, you will be downgraded to ${BRAND_NAME} Free, which only offers up to 1 GB of Mail storage and up to 5 GB of Drive storage. You will also lose any previously awarded storage bonuses.`,
    };
};

export const getDefaultTBStorageWarning = (planName: string, planMaxSpace: string) => {
    return {
        title: c('Subscription reminder').t`Extra storage and bonuses`,
        description: c('Subscription reminder')
            .t`${planName} offers ${planMaxSpace} storage for your emails, attachments, events, passwords, and files. You are also eligible for yearly storage bonuses.`,
        warning: c('Subscription reminder')
            .t`When you cancel ${planName}, you will be downgraded to ${BRAND_NAME} Free, which only offers up to 1 GB of Mail storage and up to 5 GB of Drive storage. You will also lose any previously awarded storage bonuses.`,
    };
};
