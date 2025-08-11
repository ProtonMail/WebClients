import { type ReactElement, type ReactNode } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { DashboardCard, DashboardCardContent } from '@proton/atoms';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcChevronRight } from '@proton/icons';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { hasPaidVpn } from '@proton/shared/lib/user/helpers';
import clsx from '@proton/utils/clsx';

import household from './illustrations/household.svg';
import roundTheClockProtection from './illustrations/round-the-clock-protection.svg';
import sensitiveData from './illustrations/sensitive-data.svg';
import tv from './illustrations/tv.svg';

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

export const VpnGetMoreSection = () => {
    const [user] = useUser();

    const sections: Section[] = [
        {
            title: () => c('Blog').t`Get round-the-clock protection`,
            description: () => c('Blog').t`Enable kill switch and auto-connect in your VPN settings.`,
            image: roundTheClockProtection,
        },
        {
            title: () => c('Blog').t`Watch your favorite movies and TV shows`,
            label: (
                <Label
                    key="watch-shows-label"
                    prefix={<VpnLogo variant="glyph-only" size={5} />}
                    text={PLAN_NAMES[PLANS.VPN2024]}
                />
            ),
            description: () =>
                hasPaidVpn(user)
                    ? getBoldFormattedText(c('Blog').t`**Streaming** is included in your subscription.`)
                    : c('Blog').t`Stream from all major platforms with ${PLAN_NAMES[PLANS.VPN2024]}.`,
            image: tv,
            link: !hasPaidVpn(user) ? '/vpn/upgrade' : undefined,
        },
        {
            title: () => c('Blog').t`Working with sensitive data?`,
            label: (
                <Label
                    key="sensitive-data-label"
                    prefix={<VpnLogo variant="glyph-only" size={5} />}
                    text={PLAN_NAMES[PLANS.VPN_BUSINESS]}
                />
            ),
            description: () =>
                c('Blog').t`Protect your company from data breaches and make remote work safer with an enterprise VPN.`,
            image: sensitiveData,
            link: 'https://proton.me/business/vpn',
        },
        {
            title: () => c('Blog').t`Protect your whole household with 1 device`,
            label: <Label key="advanced-label" text={c('Label').t`Advanced`} />,
            description: () => c('Blog').t`Learn how to enable ${VPN_APP_NAME} on your router.`,
            image: household,
            link: 'https://protonvpn.com/support/installing-protonvpn-on-a-router?srsltid=AfmBOop2RjZzvRqhNW0eEQaVNEr1LMgRGdbHuLcvuZ1owoKhK-1iEGqS',
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

export default VpnGetMoreSection;
