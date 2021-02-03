import React from 'react';
import PropTypes from 'prop-types';
import { PLAN_NAMES, PLANS, CYCLE, CURRENCIES } from 'proton-shared/lib/constants';
import { toMap } from 'proton-shared/lib/helpers/object';
import { c } from 'ttag';
import freePlanSvg from 'design-system/assets/img/pm-images/free-plan.svg';
import plusPlanSvg from 'design-system/assets/img/pm-images/plus-plan.svg';
import professionalPlanSvg from 'design-system/assets/img/pm-images/professional-plan.svg';
import visionaryPlanSvg from 'design-system/assets/img/pm-images/visionary-plan.svg';

import { LinkButton } from '../../../components';
import { useModals } from '../../../hooks';

import SubscriptionTable from './SubscriptionTable';
import SubscriptionPrices from './SubscriptionPrices';
import SubscriptionFeaturesModal from './SubscriptionFeaturesModal';

const INDEXES = {
    [PLANS.PLUS]: 1,
    [PLANS.PROFESSIONAL]: 2,
    [PLANS.VISIONARY]: 3,
};

/** @type any */
const MailSubscriptionTable = ({
    planNameSelected,
    plans: apiPlans = [],
    cycle,
    currency,
    onSelect,
    currentPlan,
    ...rest
}) => {
    const { createModal } = useModals();
    const plansMap = toMap(apiPlans, 'Name');
    const plusPlan = plansMap[PLANS.PLUS];
    const professionalPlan = plansMap[PLANS.PROFESSIONAL];
    const visionaryPlan = plansMap[PLANS.VISIONARY];
    const vpnPlusPlan = plansMap[PLANS.VPNPLUS];
    const plans = [
        {
            name: '',
            title: 'Free',
            canCustomize: false,
            price: <SubscriptionPrices cycle={cycle} currency={currency} />,
            imageSrc: freePlanSvg,
            description: c('Description').t`Basic private and secure communications`,
            features: [
                { icon: 'arrow-right', content: c('Feature').t`1 user` },
                { icon: 'arrow-right', content: c('Feature').t`500 MB storage` },
                { icon: 'arrow-right', content: c('Feature').t`1 address` },
                { icon: 'arrow-right', content: c('Feature').t`No domain support` },
                { icon: 'arrow-right', content: c('Feature').t`150 messages/day` },
                {
                    icon: 'close',
                    content: (
                        <del key="advanced">{c('Feature')
                            .t`Advanced mail features: folders, labels, filters, auto-reply, IMAP/SMTP and more`}</del>
                    ),
                },
                {
                    icon: 'close',
                    content: (
                        <del key="business">{c('Feature')
                            .t`Business mail features: Catch all email, multi user management and more`}</del>
                    ),
                },
                {
                    icon: 'close',
                    content: <del key="support">{c('Feature').t`Priority support`}</del>,
                },
                {
                    icon: 'plus',
                    content: c('Feature').t`ProtonVPN (optional) *`,
                },
            ],
        },
        plusPlan && {
            name: plusPlan.Name,
            planID: plusPlan.ID,
            title: PLAN_NAMES[PLANS.PLUS],
            canCustomize: true,
            price: <SubscriptionPrices cycle={cycle} currency={currency} plan={plusPlan} />,
            imageSrc: plusPlanSvg,
            description: c('Description').t`Full-featured individual mailbox`,
            features: [
                { icon: 'arrow-right', content: c('Feature').t`1 user` },
                { icon: 'arrow-right', content: c('Feature').t`5 GB storage *` },
                { icon: 'arrow-right', content: c('Feature').t`5 addresses *` },
                { icon: 'arrow-right', content: c('Feature').t`Supports 1 domain *` },
                { icon: 'arrow-right', content: c('Feature').t`Unlimited messages per day **` },
                {
                    icon: 'arrow-right',
                    content: c('Feature')
                        .t`Advanced mail features: folders, labels, filters, auto-reply, IMAP/SMTP and more`,
                },
                {
                    icon: 'close',
                    content: (
                        <del key="business">{c('Feature')
                            .t`Business mail features: Catch all email, multi user management and more`}</del>
                    ),
                },
                { icon: 'close', content: <del key="support">{c('Feature').t`Priority support`}</del> },
                { icon: 'plus', content: c('Feature').t`ProtonVPN (optional) *` },
            ],
        },
        professionalPlan && {
            name: professionalPlan.Name,
            planID: professionalPlan.ID,
            title: PLAN_NAMES[PLANS.PROFESSIONAL],
            canCustomize: true,
            price: (
                <SubscriptionPrices
                    cycle={cycle}
                    currency={currency}
                    plan={professionalPlan}
                    suffix={c('Suffix').t`/month/user`}
                />
            ),
            imageSrc: professionalPlanSvg,
            description: c('Description').t`For large organizations and businesses`,
            features: [
                { icon: 'arrow-right', content: c('Feature').t`1 - 5000 user(s) *` },
                { icon: 'arrow-right', content: c('Feature').t`5 GB storage per user *` },
                { icon: 'arrow-right', content: c('Feature').t`5 addresses per user *` },
                { icon: 'arrow-right', content: c('Feature').t`Supports 2 domains *` },
                { icon: 'arrow-right', content: c('Feature').t`Unlimited messages per day **` },
                {
                    icon: 'arrow-right',
                    content: c('Feature')
                        .t`Advanced mail features: folders, labels, filters, auto-reply, IMAP/SMTP and more`,
                },
                {
                    icon: 'arrow-right',
                    content: c('Feature').t`Business mail features: Catch all email, multi user management and more`,
                },
                { icon: 'arrow-right', content: c('Feature').t`Priority support` },
                { icon: 'plus', content: c('Feature').t`ProtonVPN (optional) *` },
            ],
        },
        visionaryPlan && {
            name: visionaryPlan.Name,
            planID: visionaryPlan.ID,
            title: PLAN_NAMES[PLANS.VISIONARY],
            canCustomize: false,
            price: <SubscriptionPrices cycle={cycle} currency={currency} plan={visionaryPlan} />,
            imageSrc: visionaryPlanSvg,
            description: c('Description').t`For families and small businesses`,
            features: [
                { icon: 'arrow-right', content: c('Feature').t`6 users` },
                { icon: 'arrow-right', content: c('Feature').t`20 GB storage` },
                { icon: 'arrow-right', content: c('Feature').t`50 addresses` },
                { icon: 'arrow-right', content: c('Feature').t`Supports 10 domains` },
                { icon: 'arrow-right', content: c('Feature').t`Unlimited messages per day **` },
                {
                    icon: 'arrow-right',
                    content: c('Feature')
                        .t`Advanced mail features: folders, labels, filters, auto-reply, IMAP/SMTP and more`,
                },
                {
                    icon: 'arrow-right',
                    content: c('Feature').t`Business mail features: Catch all email, multi user management and more`,
                },
                { icon: 'arrow-right', content: c('Feature').t`Priority support` },
                { icon: 'arrow-right', content: c('Feature').t`ProtonVPN included` },
            ],
        },
    ];

    return (
        <div className="mailSubscriptionTable-container">
            <SubscriptionTable
                currentPlan={currentPlan}
                currentPlanIndex={INDEXES[planNameSelected] || 0}
                mostPopularIndex={1}
                plans={plans}
                onSelect={(index, expanded) =>
                    onSelect(expanded && !index ? vpnPlusPlan.ID : plans[index].planID, expanded)
                }
                {...rest}
            />
            <p className="text-sm mt1 mb0">* {c('Info concerning plan features').t`Customizable features`}</p>
            <p className="text-sm mt0 mb1">
                **{' '}
                {c('Info concerning plan features')
                    .t`ProtonMail cannot be used for mass emailing or spamming. Legitimate emails are unlimited.`}
            </p>
            <div className="text-center pb1 on-mobile-pb2 subscriptionTable-show-features-container">
                <LinkButton
                    className="button--small"
                    onClick={() => createModal(<SubscriptionFeaturesModal currency={currency} cycle={cycle} />)}
                >
                    {c('Action').t`Show all features`}
                </LinkButton>
            </div>
        </div>
    );
};

MailSubscriptionTable.propTypes = {
    currentPlan: PropTypes.string,
    planNameSelected: PropTypes.string,
    plans: PropTypes.arrayOf(PropTypes.object),
    onSelect: PropTypes.func.isRequired,
    cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS]).isRequired,
    currency: PropTypes.oneOf(CURRENCIES).isRequired,
};

export default MailSubscriptionTable;
