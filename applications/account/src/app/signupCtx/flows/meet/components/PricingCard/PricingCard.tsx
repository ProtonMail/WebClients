import type { ReactNode } from 'react';

import { c } from 'ttag';

import {
    FREE_MAX_ACTIVE_MEETINGS,
    FREE_MAX_PARTICIPANTS,
    getMaxMeetingsText,
    getMaxParticipantsText,
    getMeetAppsText,
    getMeetBuiltInChatText,
    getMeetScreenSharingText,
    getMeetingMaxLengthText,
} from '@proton/components/containers/payments/features/meet';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import {
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import FeatureItem from '../FeatureItem/FeatureItem';
import planFreeLogo from './plan-meet-free.svg';

const LogoIconShape = ({ children, border = true }: { children: ReactNode; border?: boolean }) => {
    return (
        <div
            className={clsx(
                'w-custom ratio-square rounded-lg overflow-hidden flex items-center justify-center shrink-0',
                border ? 'border border-weak' : undefined
            )}
            style={{ '--w-custom': '2.75rem', backgroundColor: 'white' }}
            aria-hidden="true"
        >
            {children}
        </div>
    );
};

const PricingFeatures = () => {
    return (
        <div className="px-8">
            <ul className="unstyled m-0 flex flex-column gap-2">
                <FeatureItem text={getMeetingMaxLengthText('free')} highlighted />
                <FeatureItem text={getMaxParticipantsText(FREE_MAX_PARTICIPANTS)} highlighted />
                <FeatureItem text={getMaxMeetingsText(FREE_MAX_ACTIVE_MEETINGS)} highlighted />
                <FeatureItem text={getMeetAppsText()} highlighted />
                <FeatureItem text={getMeetScreenSharingText()} highlighted />
                <FeatureItem text={getMeetBuiltInChatText()} highlighted />
            </ul>
            <p className="mt-4 mb-0">
                {c('Signup: Meet')
                    .t`Your account also includes access to ${MAIL_SHORT_APP_NAME}, ${CALENDAR_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, and ${PASS_SHORT_APP_NAME} free features.`}
            </p>
        </div>
    );
};

const PricingHeader = () => {
    return (
        <>
            <div className="px-8">
                <span
                    className="rounded text-semibold py-0.5 px-1 color-primary"
                    style={{ backgroundColor: 'rgb(109 74 255 / 0.08)' }}
                >{c('Signup').t`Your plan`}</span>
            </div>
            <header className="flex flex-nowrap gap-4 items-center px-8">
                <LogoIconShape>
                    <img src={planFreeLogo} alt="" />
                </LogoIconShape>
                <span className="text-2xl text-semibold" data-testid="planName">
                    {`${BRAND_NAME} ${PLAN_NAMES[PLANS.FREE]}`}
                </span>
            </header>
        </>
    );
};

const PricingFooter = () => {
    const total = (
        <div className="flex justify-space-between gap-2 text-lg">
            <span className="text-semibold">{c('Signup').t`Total`}</span>
            <span className="text-semibold">
                <span data-testid="totalFree">{c('Signup').t`Free`}</span>
            </span>
        </div>
    );

    return (
        <footer className="border-top border-weak">
            <div className="flex flex-column px-8 pt-5 gap-2">{total}</div>
        </footer>
    );
};

export const PricingCard = () => {
    return (
        <section className={clsx('drive-signup-pricing-card w-full flex flex-column')}>
            <div className="drive-signup-pricing-card-inner fade-in w-full flex flex-column shadow-raised gap-8 py-8 bg-norm">
                <PricingHeader />
                <PricingFeatures />
                <PricingFooter />
            </div>
        </section>
    );
};
