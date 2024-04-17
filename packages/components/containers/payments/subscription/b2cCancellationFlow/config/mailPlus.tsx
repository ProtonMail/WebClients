import { differenceInDays, format, fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME, MAIL_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { SubscriptionModel, SubscriptionPlan } from '@proton/shared/lib/interfaces';
import alias from '@proton/styles/assets/img/cancellation-flow/testimonial_alias.png';
import darkWeb from '@proton/styles/assets/img/cancellation-flow/testimonial_dark_web.png';
import netShield from '@proton/styles/assets/img/cancellation-flow/testimonial_net_shield.png';

import {
    ConfirmationModal,
    PlanConfig,
    PlanConfigFeatures,
    PlanConfigStorage,
    PlanConfigTestimonial,
} from '../interface';

export const getMailPlusConfig = (
    userRewardedDrive: boolean,
    userRewardedMail: boolean,
    subscription: SubscriptionModel,
    plan: SubscriptionPlan & { Name: PLANS }
): PlanConfig => {
    const planMaxSpace = humanSize({ bytes: plan.MaxSpace, unit: 'GB', fraction: 0 });

    const reminder = {
        title: c('Subscription reminder').t`Let us remind you of everything Mail Plus can do`,
        description: c('Subscription reminder')
            .t`Mail Plus doesn't just provide extra storage. It lets you manage your emails faster, customize your inbox and email addresses, and access the desktop app.`,
    };

    const testimonials: PlanConfigTestimonial = {
        title: c('Subscription reminder').t`A direct contribution to our mission`,
        description: c('Subscription reminder')
            .t`${BRAND_NAME}'s only source of revenue is user subscriptions. Your support allows us to remain independent, advance our mission to make privacy the default online, and continue supporting activists and organizations fighting for privacy and freedom.`,
        learMoreLink: 'https://proton.me/about/impact',
        learnMoreCTA: c('Subscription reminder').t`Learn more about our impact`,
        testimonials: [
            {
                title: c('Subscription reminder').t`Our fight against censorship in Russia`,
                description: c('Subscription reminder')
                    .t`${BRAND_NAME} was targeted by Russia in one of the most aggressive censorship campaigns in recent memory, and our team fought back.`,
                ctaText: c('Subscription reminder').t`Read the story`,
                link: 'https://www.nytimes.com/2022/12/06/technology/russia-internet-proton-vpn.html',
                picture: darkWeb,
            },
            {
                title: c('Subscription reminder').t`Helping activists in Hong Kong`,
                description: c('Subscription reminder')
                    .t`After privacy and free speech were threatened in Hong Kong, we directly supported local civil rights organizations.`,
                ctaText: c('Subscription reminder').t`Watch the interview`,
                link: 'https://www.youtube.com/watch?v=QmFTporQpM8',
                picture: netShield,
            },
            {
                title: c('Subscription reminder').t`Unblocking internet access in Iran`,
                description: c('Subscription reminder')
                    .t`After ${BRAND_NAME} got blocked in Iran during protests, our customer support team worked to get our VPN app directly into people's hands.`,
                ctaText: c('Subscription reminder').t`Read the story`,
                link: 'https://www.pcmag.com/opinions/proton-vpns-new-stealth-feature-helps-fight-censorship-in-iran-and-russia',
                picture: alias,
            },
        ],
    };

    const features: PlanConfigFeatures = {
        title: c('Subscription reminder')
            .t`By downgrading your account, you will lose access to these important features`,
        features: [
            {
                icon: 'storage',
                text: c('Subscription reminder').t`${planMaxSpace} total storage`,
            },
            {
                icon: 'gift',
                text: c('Subscription reminder').t`Yearly free storage bonuses`,
            },
            {
                icon: 'envelopes',
                text: c('Subscription reminder').t`10 email addresses`,
            },
            {
                icon: 'folders',
                text: c('Subscription reminder').t`Unlimited folders, labels and filters`,
            },
            {
                icon: 'globe',
                text: c('Subscription reminder').t`Your own custom email domain`,
            },
            {
                icon: 'calendar-grid',
                text: c('Subscription reminder').t`Calendar sharing`,
            },
            {
                icon: 'at',
                text: c('Subscription reminder').t`Your own short @pm.me email alias`,
            },
            {
                icon: 'clock-paper-plane',
                text: c('Subscription reminder').t`Custom schedule send and snooze times`,
            },
            {
                icon: 'tv',
                text: c('Subscription reminder').t`${MAIL_APP_NAME} desktop app`,
            },
            {
                icon: 'life-ring',
                text: c('Subscription reminder').t`Priority support`,
            },
        ],
    };

    const storageWarning = userRewardedMail
        ? userRewardedDrive
            ? getBoldFormattedText(
                  c('Subscription reminder')
                      .t`By canceling your Mail Plus subscription, your storage will decrease from **${planMaxSpace}** to **1 GB** for Mail, and **5 GB** for Drive. You will also lose any storage bonuses earned previously.`
              )
            : getBoldFormattedText(
                  c('Subscription reminder')
                      .t`By canceling your Mail Plus subscription, your storage will decrease from **${planMaxSpace}** to **1 GB** for Mail, and **1 GB** for Drive. You will also lose any storage bonuses earned previously.`
              )
        : userRewardedDrive
          ? getBoldFormattedText(
                c('Subscription reminder')
                    .t`By canceling your Mail Plus subscription, your storage will decrease from **${planMaxSpace}** to **500 MB** for Mail, and **5 GB** for Drive. You will also lose any storage bonuses earned previously.`
            )
          : getBoldFormattedText(
                c('Subscription reminder')
                    .t`By canceling your Mail Plus subscription, your storage will decrease from **${planMaxSpace}** to **500 MB** for Mail, and **1 GB** for Drive. You will also lose any storage bonuses earned previously.`
            );

    const storage: PlanConfigStorage = {
        title: c('Subscription reminder').t`By downgrading your account, you will also lose storage space`,
        warning: storageWarning,
        quotaWarning: [
            {
                title: c('Subscription reminder').t`If you exceed your free Mail storage quota:`,
                description: [
                    {
                        id: 1,
                        text: getBoldFormattedText(
                            c('Subscription reminder').t`Your inbox will **stop receiving new emails**`
                        ),
                    },
                    {
                        id: 2,
                        text: getBoldFormattedText(
                            c('Subscription reminder').t`You **won't be able to send emails** with attachments`
                        ),
                    },
                    {
                        id: 3,
                        text: getBoldFormattedText(c('Subscription reminder').t`Your **calendar will be frozen**`),
                    },
                ],
            },
            {
                title: c('Subscription reminder').t`If you exceed your free Drive storage quota:`,
                description: [
                    {
                        id: 1,
                        text: getBoldFormattedText(c('Subscription reminder').t`Your devices will **stop syncing**`),
                    },
                    {
                        id: 2,
                        text: getBoldFormattedText(
                            c('Subscription reminder').t`You **won't be able to add any new files**`
                        ),
                    },
                    {
                        id: 3,
                        text: getBoldFormattedText(
                            c('Subscription reminder').t`You **won't be able to backup photos** from your devices`
                        ),
                    },
                ],
            },
        ],
    };

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

    const confirmationModal: ConfirmationModal = {
        description: c('Subscription reminder')
            .jt`You still have ${expiryDate} on your Mail Plus plan. We'll add the credits for the remaining time to your ${BRAND_NAME} Account. Make sure you do not exceed the free plan limits before canceling.`,
        learnMoreLink: '/free-plan-limits',
    };

    return {
        plan: PLANS.MAIL,
        reminder,
        testimonials,
        features,
        storage,
        confirmationModal,
        planCta: c('Subscription reminder').t`Keep Mail Plus`,
        redirectModal: c('Subscription reminder').t`Resubscribe to restore access to Mail Plus features.`,
    };
};
