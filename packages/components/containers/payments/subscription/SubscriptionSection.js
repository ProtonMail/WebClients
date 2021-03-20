import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { PLAN_NAMES } from 'proton-shared/lib/constants';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { identity } from 'proton-shared/lib/helpers/function';
import { getPlanIDs } from 'proton-shared/lib/helpers/subscription';

import { Alert, LinkButton, Href, Loader, Meter } from '../../../components';
import { useModals, useSubscription, useOrganization, useUser, useAddresses } from '../../../hooks';
import MozillaInfoPanel from '../../account/MozillaInfoPanel';
import { formatPlans } from './helpers';
import UpsellSubscription from './UpsellSubscription';
import SubscriptionModal from './SubscriptionModal';
import UnsubscribeButton from './UnsubscribeButton';
import { SUBSCRIPTION_STEPS } from './constants';

const AddonRow = ({ label, used, max, format = identity }) => {
    const percentage = Math.round((used * 100) / max);
    return (
        <div className="flex-autogrid on-mobile-flex-column w100 mb1">
            <div className="flex-autogrid-item pl1">{label}</div>
            <div className="flex-autogrid-item">
                <strong>
                    {Number.isInteger(used) ? `${format(used)} ${c('x of y').t`of`} ${format(max)}` : format(max)}
                </strong>
            </div>
            <div className="flex-autogrid-item">
                {Number.isInteger(percentage) ? <Meter value={percentage} /> : null}
            </div>
        </div>
    );
};

AddonRow.propTypes = {
    label: PropTypes.string.isRequired,
    used: PropTypes.number,
    max: PropTypes.number.isRequired,
    format: PropTypes.func,
};

const SubscriptionSection = ({ permission }) => {
    const [{ hasPaidMail, hasPaidVpn, isPaid, isFree }] = useUser();
    const [addresses, loadingAddresses] = useAddresses();
    const [subscription, loadingSubscription] = useSubscription();
    const { createModal } = useModals();
    const [organization, loadingOrganization] = useOrganization();
    const hasAddresses = Array.isArray(addresses) && addresses.length > 0;

    if (!permission) {
        return <Alert>{c('Info').t`No subscription yet`}</Alert>;
    }

    if (loadingSubscription || loadingOrganization || loadingAddresses) {
        return <Loader />;
    }

    const { Plans = [], Cycle, CouponCode, Currency, isManagedByMozilla } = subscription;

    if (isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const {
        UsedDomains,
        MaxDomains,
        UsedSpace,
        MaxSpace,
        UsedAddresses,
        MaxAddresses,
        UsedMembers,
        MaxMembers,
        MaxVPN,
    } = organization || {};

    const { mailPlan, vpnPlan } = formatPlans(Plans);
    const { Name: mailPlanName } = mailPlan || {};
    const { Name: vpnPlanName } = vpnPlan || {};

    const handleModal = () => {
        createModal(
            <SubscriptionModal
                planIDs={getPlanIDs(subscription)}
                coupon={CouponCode || undefined} // CouponCode can equal null
                currency={Currency}
                cycle={Cycle}
                step={isFree ? SUBSCRIPTION_STEPS.PLAN_SELECTION : SUBSCRIPTION_STEPS.CUSTOMIZATION}
            />
        );
    };

    const mailAddons = [
        hasPaidMail && { label: c('Label').t`Users`, used: UsedMembers, max: MaxMembers },
        hasPaidMail && { label: c('Label').t`Email addresses`, used: UsedAddresses, max: MaxAddresses },
        hasPaidMail && {
            label: c('Label').t`Storage capacity`,
            used: UsedSpace,
            max: MaxSpace,
            humanSize,
            format: (v) => humanSize(v),
        },
        hasPaidMail && { label: c('Label').t`Custom domains`, used: UsedDomains, max: MaxDomains },
        mailPlanName === 'visionary' && { label: c('Label').t`VPN connections`, max: MaxVPN },
    ].filter(Boolean);

    const vpnAddons = [
        hasPaidVpn
            ? { label: c('Label').t`VPN connections`, max: MaxVPN }
            : { label: c('Label').t`VPN connections`, max: 1 },
    ];

    return (
        <>
            <Alert>{c('Info')
                .t`To manage your subscription, including billing frequency and currency, or to switch to another plan, click on Manage subscription.`}</Alert>
            <div className="shadow-norm mb1">
                <div className="border-bottom pt1 pl1 pr1 on-mobile-pb1">
                    <div className="flex-autogrid flex-align-items-center on-mobile-flex-column w100 mb1">
                        <div className="flex-autogrid-item">ProtonMail plan</div>
                        <div className="flex-autogrid-item">
                            <strong>
                                {hasPaidMail ? (
                                    PLAN_NAMES[mailPlanName]
                                ) : hasAddresses ? (
                                    c('Plan').t`Free`
                                ) : (
                                    <Href url="https://mail.protonmail.com/login">{c('Info').t`Not activated`}</Href>
                                )}
                            </strong>
                        </div>
                        <div className="flex-autogrid-item">
                            {hasAddresses || mailPlanName === 'visionary' ? (
                                <LinkButton onClick={handleModal}>{c('Action').t`Manage subscription`}</LinkButton>
                            ) : null}
                        </div>
                    </div>
                    {mailAddons.map((props, index) => (
                        <AddonRow key={index} {...props} />
                    ))}
                </div>
                {mailPlanName === 'visionary' ? null : (
                    <div className="pt1 pl1 pr1">
                        <div className="flex-autogrid on-mobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">ProtonVPN plan</div>
                            <div className="flex-autogrid-item">
                                <strong>{hasPaidVpn ? PLAN_NAMES[vpnPlanName] : c('Plan').t`Free`}</strong>
                            </div>
                            <div className="flex-autogrid-item">
                                <LinkButton onClick={handleModal}>{c('Action').t`Manage subscription`}</LinkButton>
                            </div>
                        </div>
                        {vpnAddons.map((props, index) => (
                            <AddonRow key={index} {...props} />
                        ))}
                    </div>
                )}
                {isPaid ? (
                    <div className="pl1 pr1 pt0-5 pb0-5">
                        <UnsubscribeButton color="danger" shape="outline">{c('Action')
                            .t`Cancel subscription`}</UnsubscribeButton>
                    </div>
                ) : null}
            </div>
            <UpsellSubscription />
        </>
    );
};

SubscriptionSection.propTypes = {
    permission: PropTypes.bool,
};

export default SubscriptionSection;
