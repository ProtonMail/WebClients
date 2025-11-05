import type { ReactElement, ReactNode } from 'react';

import { c } from 'ttag';

import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import MailLogo from '@proton/components/components/logo/MailLogo';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import type { Subscription } from '@proton/payments';
import { PLANS, PLAN_NAMES, hasFree } from '@proton/payments';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getBlogURL } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import businessCommunication from './illustrations/business-communication.svg';
import filters from './illustrations/filters.svg';
import manageInbox from './illustrations/manage-inbox.svg';
import manageSubscription from './illustrations/manage-subscriptions.svg';

interface Section {
    title: () => string;
    label?: ReactElement;
    description: () => string | ReactElement;
    image: string;
    link?: string;
}

const Label = ({ prefix, text }: { prefix?: ReactNode; text: string }) => {
    return (
        <div>
            <span className="inline-flex rounded-sm items-center gap-1 border border-weak bg-norm px-1">
                {prefix}
                <span className="text-sm uppercase color-weak text-semibold">{text}</span>
            </span>
        </div>
    );
};

interface Props {
    subscription: Subscription | undefined;
}
export const MailGetMoreSection = ({ subscription }: Props) => {
    const isFreeSubscription = hasFree(subscription);

    const sections: Section[] = [
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
            label: (
                <Label
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
            label: (
                <Label
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
            label: <Label key="advanced-label" text={c('Label').t`Advanced`} />,
            description: () => c('Blog').t`Automate recurring actions to sort and organize incoming emails.`,
            image: filters,
            link: 'https://proton.me/support/email-inbox-filters',
        },
    ];

    return (
        <DashboardCard>
            <DashboardCardContent className="lg:h-full" paddingClass="p-3">
                <div className="flex flex-column items-center lg:justify-space-between lg:h-full gap-2">
                    {sections.map((section) => {
                        const Element = section.link ? 'a' : 'div';

                        const key = section.title();

                        return (
                            <Element
                                {...(section.link && {
                                    target: '_blank',
                                    rel: 'noopener noreferrer',
                                    href: section.link,
                                })}
                                key={key}
                                className={clsx(
                                    'flex flex-nowrap items-center p-2 gap-4 w-full relative rounded-lg text-no-decoration',
                                    section.link && 'interactive-pseudo-protrude'
                                )}
                                aria-label={section.title()}
                            >
                                <figure
                                    className="w-custom rounded overflow-hidden ratio-square"
                                    style={{ '--w-custom': '4.5rem' }}
                                    key={`fig-${key}`}
                                >
                                    <img src={section.image} alt="" className="w-full" />
                                </figure>
                                <div className="w-full flex flex-column gap-1" key={`section-label-${key}`}>
                                    {section.label}
                                    <h3 className="text-lg text-semibold m-0">{section.title()}</h3>
                                    <p className="m-0 text-ellipsis-two-lines color-weak">{section.description()}</p>
                                </div>
                                {section.link && (
                                    <IcChevronRight key={`icon-${key}`} className="shrink-0 color-hint" size={6} />
                                )}
                            </Element>
                        );
                    })}
                </div>
            </DashboardCardContent>
        </DashboardCard>
    );
};

export default MailGetMoreSection;
