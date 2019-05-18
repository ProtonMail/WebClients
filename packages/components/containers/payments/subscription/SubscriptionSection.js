import React from 'react';
import { c } from 'ttag';
import {
    SubTitle,
    SmallButton,
    Loader,
    MozillaInfoPanel,
    Progress,
    useModals,
    useSubscription,
    useOrganization,
    useUser
} from 'react-components';
import { CYCLE, PLAN_NAMES, COUPON_CODES } from 'proton-shared/lib/constants';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { formatPlans, toPlanNames, isBundleEligible } from './helpers';
import CouponDiscountBadge from '../CouponDiscountBadge';
import SubscriptionModal from './SubscriptionModal';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;
const { BUNDLE } = COUPON_CODES;

const CYCLES = {
    [MONTHLY]: c('Billing cycle').t`Monthly`,
    [YEARLY]: c('Billing cycle').t`Yearly`,
    [TWO_YEARS]: c('Billing cycle').t`2-year`
};

const SubscriptionSection = () => {
    const [{ hasPaidMail, hasPaidVpn, isPaid }] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const { createModal } = useModals();
    const bundleEligible = isBundleEligible(subscription);
    const { Plans = [], Cycle, CouponCode, Currency } = subscription;
    const [
        {
            UsedDomains,
            MaxDomains,
            UsedSpace,
            MaxSpace,
            UsedAddresses,
            MaxAddresses,
            UsedMembers,
            MaxMembers,
            UsedVPN,
            MaxVPN
        } = {},
        loadingOrganization
    ] = useOrganization();

    if (subscription.isManagedByMozilla) {
        return (
            <>
                <SubTitle>{c('Title').t`Subscription`}</SubTitle>
                <MozillaInfoPanel />
            </>
        );
    }

    if (loadingSubscription || loadingOrganization) {
        return (
            <>
                <SubTitle>{c('Title').t`Subscription`}</SubTitle>
                <Loader />
            </>
        );
    }

    const { mailPlan, vpnPlan } = formatPlans(Plans);
    const { Name: mailPlanName } = mailPlan || {};
    const canRemoveCoupon = CouponCode && CouponCode !== BUNDLE;

    const handleModal = (action = '') => () => {
        const coupon = action === 'remove-coupon' ? '' : CouponCode ? CouponCode : undefined; // CouponCode can equals null
        const cycle = action === 'yearly' ? YEARLY : Cycle;
        const plansMap = isPaid ? toPlanNames(subscription.Plans) : { plus: 1, vpnplus: 1 };

        createModal(<SubscriptionModal plansMap={plansMap} coupon={coupon} currency={Currency} cycle={cycle} />);
    };

    return (
        <>
            <SubTitle>{c('Title').t`Subscription`}</SubTitle>
            <div className="shadow-container">
                <div className="p1">
                    <div className="flex-autogrid onmobile-flex-column w100 mb1">
                        <div className="flex-autogrid-item">ProtonMail plan</div>
                        <div className="flex-autogrid-item">
                            <strong>{hasPaidMail ? PLAN_NAMES[mailPlanName] : c('Plan').t`Free`}</strong>
                        </div>
                        <div className="flex-autogrid-item">
                            {bundleEligible &&
                                c('Info').t`Combine paid ProtonMail and ProtonVPN and get a 20% discount on both`}
                        </div>
                        <div className="flex-autogrid-item alignright">
                            <SmallButton onClick={handleModal()}>
                                {hasPaidMail ? c('Action').t`Manage` : c('Action').t`Upgrade`}
                            </SmallButton>
                        </div>
                    </div>
                    {hasPaidMail ? (
                        <>
                            <div className="flex-autogrid onmobile-flex-column w100 mb1">
                                <div className="flex-autogrid-item pl1">{c('Label').t`Users`}</div>
                                <div className="flex-autogrid-item">
                                    <strong>{`${UsedMembers}/${MaxMembers}`}</strong>
                                </div>
                                <div className="flex-autogrid-item">
                                    <Progress value={(UsedMembers * 100) / MaxMembers} />
                                </div>
                                <div className="flex-autogrid-item" />
                            </div>
                            <div className="flex-autogrid onmobile-flex-column w100 mb1">
                                <div className="flex-autogrid-item pl1">{c('Label').t`Email addresses`}</div>
                                <div className="flex-autogrid-item">
                                    <strong>{`${UsedAddresses}/${MaxAddresses}`}</strong>
                                </div>
                                <div className="flex-autogrid-item">
                                    <Progress value={(UsedAddresses * 100) / MaxAddresses} />
                                </div>
                                <div className="flex-autogrid-item alignright" />
                            </div>
                            <div className="flex-autogrid onmobile-flex-column w100 mb1">
                                <div className="flex-autogrid-item pl1">{c('Label').t`Storage capacity`}</div>
                                <div className="flex-autogrid-item">
                                    <strong>{`${humanSize(UsedSpace, 'GB', true)}/${humanSize(
                                        MaxSpace,
                                        'GB'
                                    )}`}</strong>
                                </div>
                                <div className="flex-autogrid-item">
                                    <Progress value={(UsedSpace * 100) / MaxSpace} />
                                </div>
                                <div className="flex-autogrid-item alignright" />
                            </div>
                            <div className="flex-autogrid onmobile-flex-column w100 mb1">
                                <div className="flex-autogrid-item pl1">{c('Label').t`Custom domains`}</div>
                                <div className="flex-autogrid-item">
                                    <strong className="mr1">{`${UsedDomains}/${MaxDomains}`}</strong>
                                </div>
                                <div className="flex-autogrid-item">
                                    <Progress value={(UsedDomains * 100) / MaxDomains} />
                                </div>
                                <div className="flex-autogrid-item alignright" />
                            </div>
                            {mailPlanName === 'visionary' ? (
                                <div className="flex-autogrid onmobile-flex-column w100 mb1">
                                    <div className="flex-autogrid-item pl1">{c('Label').t`VPN connections`}</div>
                                    <div className="flex-autogrid-item">
                                        <strong>{`${UsedVPN}/${MaxVPN}`}</strong>
                                    </div>
                                    <div className="flex-autogrid-item">
                                        <Progress value={(UsedVPN * 100) / MaxVPN} />
                                    </div>
                                    <div className="flex-autogrid-item alignright" />
                                </div>
                            ) : null}
                        </>
                    ) : null}
                    {mailPlanName === 'visionary' ? null : (
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">ProtonVPN plan</div>
                            <div className="flex-autogrid-item">
                                <strong>{hasPaidVpn ? PLAN_NAMES[vpnPlan.Name] : c('Plan').t`Free`}</strong>
                            </div>
                            <div className="flex-autogrid-item">
                                {bundleEligible &&
                                    c('Info').t`Combine paid ProtonMail and ProtonVPN and get a 20% discount on both`}
                            </div>
                            <div className="flex-autogrid-item alignright">
                                <SmallButton onClick={handleModal()}>
                                    {hasPaidVpn ? c('Action').t`Manage` : c('Action').t`Upgrade`}
                                </SmallButton>
                            </div>
                        </div>
                    )}
                    {hasPaidVpn ? (
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item pl1">{c('Label').t`VPN connections`}</div>
                            <div className="flex-autogrid-item">
                                <strong>{`${UsedVPN}/${MaxVPN}`}</strong>
                            </div>
                            <div className="flex-autogrid-item">
                                <Progress value={(UsedVPN * 100) / MaxVPN} />
                            </div>
                            <div className="flex-autogrid-item alignright" />
                        </div>
                    ) : null}
                </div>
                <div className="p1 bg-global-light">
                    <div className="flex-autogrid onmobile-flex-column w100">
                        <div className="flex-autogrid-item">{c('Label').t`Billing cycle`}</div>
                        <div className="flex-autogrid-item">
                            <strong>{CYCLES[Cycle]}</strong>
                        </div>
                        {Cycle === MONTHLY && (
                            <div className="flex-autogrid-item">{c('Info')
                                .t`Switch to annual billing for a 20% discount`}</div>
                        )}
                        {Cycle === YEARLY && (
                            <div className="flex-autogrid-item color-global-success">{c('Info')
                                .t`20% rebate applied to your subscription`}</div>
                        )}
                        {Cycle === TWO_YEARS && (
                            <div className="flex-autogrid-item color-global-success">{c('Info')
                                .t`33% rebate applied to your subscription`}</div>
                        )}
                        <div className="flex-autogrid-item alignright">
                            {Cycle === MONTHLY ? (
                                <SmallButton className="pm-button--primary" onClick={handleModal('yearly')}>{c('Action')
                                    .t`Pay yearly`}</SmallButton>
                            ) : null}
                        </div>
                    </div>
                    {CouponCode ? (
                        <div className="flex-autogrid onmobile-flex-column w100 mt1">
                            <div className="flex-autogrid-item">{c('Label').t`Coupon`}</div>
                            <div className="flex-autogrid-item">
                                <strong>{CouponCode}</strong>
                            </div>
                            <div className="flex-autogrid-item color-global-success">
                                <CouponDiscountBadge code={CouponCode} />
                            </div>
                            <div className="flex-autogrid-item alignright">
                                {canRemoveCoupon ? (
                                    <SmallButton onClick={handleModal('remove-coupon')}>{c('Action')
                                        .t`Remove coupon`}</SmallButton>
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
};

export default SubscriptionSection;
