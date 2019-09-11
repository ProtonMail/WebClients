import React from 'react';
import { c, msgid } from 'ttag';
import { PLANS, PLAN_TYPES, CYCLE } from 'proton-shared/lib/constants';
import { Info } from 'react-components';
import freePlanSvg from 'design-system/assets/img/pv-images/plans/free.svg';
import basicPlanSvg from 'design-system/assets/img/pv-images/plans/basic.svg';
import plusPlanSvg from 'design-system/assets/img/pv-images/plans/plus.svg';
import visionaryPlanSvg from 'design-system/assets/img/pv-images/plans/visionary.svg';

export const PLAN = {
    FREE: 'free',
    VISIONARY: PLANS.VISIONARY,
    BASIC: PLANS.VPNBASIC,
    PLUS: PLANS.VPNPLUS
};

export const PLAN_NAMES = {
    [PLAN.FREE]: 'Free',
    [PLAN.VISIONARY]: 'Visionary',
    [PLAN.BASIC]: 'Basic',
    [PLAN.PLUS]: 'Plus'
};

export const VPN_PLANS = [PLAN.FREE, PLAN.BASIC, PLAN.PLUS, PLAN.VISIONARY];
export const BEST_DEAL_PLANS = [PLAN.BASIC, PLAN.PLUS, PLAN.VISIONARY];

const getPlanFeatures = (plan, maxConnections, countries) =>
    ({
        [PLAN.FREE]: {
            image: <img width={13} src={freePlanSvg} alt={`${PLAN_NAMES[PLAN.FREE]} plan image`} />,
            description: c('Plan Description').t`Privacy and security for everyone`,
            upsell: {
                planName: PLAN.BASIC,
                features: [
                    c('Plan Feature').t`High speed 1 Gbps VPN servers`,
                    c('Plan Feature').t`Access to ${countries.basic.length} countries`,
                    c('Plan Feature').t`Filesharing/P2P support`
                ]
            },
            features: [
                c('Plan Feature').ngettext(
                    msgid`${maxConnections} simultaneous VPN connection`,
                    `${maxConnections} simultaneous VPN connections`,
                    maxConnections
                ),
                c('Plan Feature').t`Servers in ${countries.free.length} countries`,
                c('Plan Feature').t`Medium speed`,
                c('Plan Feature').t`No logs policy`,
                c('Plan Feature').t`No data limit`,
                c('Plan Feature').t`No ads`
            ]
        },
        [PLAN.BASIC]: {
            image: <img width={60} src={basicPlanSvg} alt={`${PLAN_NAMES[PLAN.BASIC]} plan image`} />,
            description: c('Plan Description').t`Basic privacy features`,
            additionalFeatures: c('Plan feature').t`All ${PLAN_NAMES[PLAN.FREE]} plan features`,
            upsell: {
                planName: PLAN.PLUS,
                features: [
                    c('Plan Feature').t`Highest speed servers (10 Gbps)`,
                    c('Plan Feature').t`Access blocked content`,
                    c('Plan Feature').t`All advanced security features`
                ]
            },
            features: [
                c('Plan Feature').ngettext(
                    msgid`${maxConnections} simultaneous VPN connection`,
                    `${maxConnections} simultaneous VPN connections`,
                    maxConnections
                ),
                c('Plan Feature').t`Servers in ${countries.basic.length} countries`,
                c('Plan Feature').t`High speed servers`,
                c('Plan Feature').t`Filesharing/P2P support`,
                c('Plan Feature').t`No logs policy`,
                <>
                    <span className="mr0-5">{c('Plan Feature').t`P2P support`}</span>
                    <Info title={c('Tooltip').t`Support for file sharing protocols such as Bittorrent.`} />
                </>
            ]
        },
        [PLAN.PLUS]: {
            image: <img width={60} src={plusPlanSvg} alt={`${PLAN_NAMES[PLAN.PLUS]} plan image`} />,
            isBest: true,
            description: c('Plan Description').t`Advanced security features`,
            additionalFeatures: c('Plan feature').t`All ${PLAN_NAMES[PLAN.BASIC]} plan features`,
            features: [
                c('Plan Feature').ngettext(
                    msgid`${maxConnections} simultaneous VPN connection`,
                    `${maxConnections} simultaneous VPN connections`,
                    maxConnections
                ),
                countries.basic.length !== countries.all.length &&
                    c('Plan Feature').t`Servers in ${countries.all.length} countries`,
                c('Plan Feature').t`Secure Core`,
                c('Plan Feature').t`Highest speeds`,
                <>
                    <span className="mr0-5">{c('Plan Feature').t`Access blocked content`}</span>
                    <Info
                        title={c('Tooltip')
                            .t`Access content (Netflix, Amazon Prime, Wikipedia, Facebook, Youtube, etc) no matter where you are.`}
                    />
                </>
            ]
        },
        [PLAN.VISIONARY]: {
            image: <img width={100} src={visionaryPlanSvg} alt={`${PLAN_NAMES[PLAN.VISIONARY]} plan image`} />,
            description: c('Plan Description').t`The complete privacy suite`,
            additionalFeatures: c('Plan feature').t`All ${PLAN_NAMES[PLAN.PLUS]} plan features`,
            features: [
                c('Plan Feature').ngettext(
                    msgid`${maxConnections} simultaneous VPN connection`,
                    `${maxConnections} simultaneous VPN connections`,
                    maxConnections
                ),
                c('Plan Feature').t`ProtonMail Visionary account`
            ]
        }
    }[plan]);

// To use coupon, AmountDue from coupon must be merged into plan.
const getPlanPrice = (plan, cycle) => {
    const monthly = plan.Pricing[CYCLE.MONTHLY];
    const cyclePrice = plan.Pricing[cycle];
    const adjustedTotal = plan.AmountDue;

    const total = typeof adjustedTotal !== 'undefined' ? adjustedTotal : cyclePrice;
    const saved = monthly * cycle - cyclePrice;
    const totalMonthly = total / cycle;

    return { monthly, total, totalMonthly, saved };
};

export const getPlan = (planName, cycle, plans = [], countries = []) => {
    const plan = plans.find(({ Type, Name }) => Type === PLAN_TYPES.PLAN && Name === planName);
    const price = plan ? getPlanPrice(plan, cycle) : { monthly: 0, total: 0, totalMonthly: 0, saved: 0 };
    return {
        ...getPlanFeatures(planName, plan ? plan.MaxVPN : 1, countries),
        planName,
        title: PLAN_NAMES[planName],
        id: plan && plan.ID,
        disabled: !plan && planName !== PLAN.FREE,
        price,
        couponDiscount: plan && Math.abs(plan.CouponDiscount),
        couponDescription: plan && plan.CouponDescription
    };
};
