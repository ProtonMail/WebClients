import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Alert,
    SubTitle,
    SmallButton,
    Loader,
    MozillaInfoPanel,
    Progress,
    useModals,
    useSubscription,
    useOrganization,
    useUser,
    useAddresses
} from 'react-components';
import { PLAN_NAMES } from 'proton-shared/lib/constants';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { identity } from 'proton-shared/lib/helpers/function';

import { formatPlans, toPlanNames } from './helpers';
import SubscriptionModal from './SubscriptionModal';

const AddonRow = ({ label, used, max, format = identity }) => {
    return (
        <div className="flex-autogrid onmobile-flex-column w100 mb1">
            <div className="flex-autogrid-item pl1">{label}</div>
            <div className="flex-autogrid-item">
                <strong>{used ? `${format(used)} ${c('x of y').t`of`} ${format(max)}` : format(max)}</strong>
            </div>
            <div className="flex-autogrid-item">{used ? <Progress value={(used * 100) / max} /> : null}</div>
        </div>
    );
};

AddonRow.propTypes = {
    label: PropTypes.string.isRequired,
    used: PropTypes.number,
    max: PropTypes.number.isRequired,
    format: PropTypes.func
};

const SubscriptionSection = ({ permission }) => {
    const [{ hasPaidMail, hasPaidVpn }] = useUser();
    const [addresses = [], loadingAddresses] = useAddresses();
    const [subscription, loadingSubscription] = useSubscription();
    const { createModal } = useModals();
    const [organization, loadingOrganization] = useOrganization();

    const subTitle = <SubTitle>{c('Title').t`Subscription`}</SubTitle>;

    if (!permission) {
        return (
            <>
                {subTitle}
                <Alert>{c('Info').t`No subscription yet`}</Alert>
            </>
        );
    }

    if (loadingSubscription || loadingOrganization || loadingAddresses) {
        return (
            <>
                {subTitle}
                <Loader />
            </>
        );
    }

    const { Plans = [], Cycle, CouponCode, Currency, isManagedByMozilla } = subscription;

    if (isManagedByMozilla) {
        return (
            <>
                {subTitle}
                <MozillaInfoPanel />
            </>
        );
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
        MaxVPN
    } = organization || {};

    const { mailPlan, vpnPlan } = formatPlans(Plans);
    const { Name: mailPlanName } = mailPlan || {};
    const { Name: vpnPlanName } = vpnPlan || {};

    const handleModal = () => {
        createModal(
            <SubscriptionModal
                subscription={subscription}
                plansMap={toPlanNames(subscription.Plans)}
                coupon={CouponCode || undefined} // CouponCode can equal null
                currency={Currency}
                cycle={Cycle}
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
            format: (v) => humanSize(v, 'GB')
        },
        hasPaidMail && { label: c('Label').t`Custom domains`, used: UsedDomains, max: MaxDomains },
        mailPlanName === 'visionary' && { label: c('Label').t`VPN connections`, max: MaxVPN }
    ].filter(Boolean);

    const vpnAddons = [hasPaidVpn && { label: c('Label').t`VPN connections`, max: MaxVPN }].filter(Boolean);

    return (
        <>
            {subTitle}
            <Alert>{c('Info')
                .t`To manage your subscription, customize your current plan or select another one from the plan's table.`}</Alert>
            <div className="shadow-container">
                <div className="border-bottom pt1 pl1 pr1 relative">
                    {hasPaidMail && mailPlanName !== 'visionary' ? (
                        <SmallButton
                            className="pm-button--primary absolute"
                            style={{ right: '2em', top: '1em' }}
                            onClick={handleModal}
                        >
                            {c('Action').t`Customize`}
                        </SmallButton>
                    ) : null}
                    <div className="flex-autogrid onmobile-flex-column w100 mb1">
                        <div className="flex-autogrid-item">ProtonMail plan</div>
                        <div className="flex-autogrid-item">
                            <strong>
                                {hasPaidMail
                                    ? PLAN_NAMES[mailPlanName]
                                    : addresses.length
                                    ? c('Plan').t`Free`
                                    : c('Info').t`Not activated`}
                            </strong>
                        </div>
                        <div className="flex-autogrid-item" />
                    </div>
                    {mailAddons.map((props, index) => (
                        <AddonRow key={index} {...props} />
                    ))}
                </div>
                {mailPlanName === 'visionary' ? null : (
                    <div className="pt1 pl1 pr1">
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">ProtonVPN plan</div>
                            <div className="flex-autogrid-item">
                                <strong>{hasPaidVpn ? PLAN_NAMES[vpnPlanName] : c('Plan').t`Free`}</strong>
                            </div>
                            <div className="flex-autogrid-item" />
                        </div>
                        {vpnAddons.map((props, index) => (
                            <AddonRow key={index} {...props} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

SubscriptionSection.propTypes = {
    permission: PropTypes.bool
};

export default SubscriptionSection;
