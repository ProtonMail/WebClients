import React from 'react';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';
import { PlanIDs, Cycle, Currency, Subscription, Plan } from 'proton-shared/lib/interfaces';
import { isProductPayer } from 'proton-shared/lib/helpers/blackfriday';

import { useModals, useConfig, useCyberMondayPeriod } from '../../hooks';
import { TopNavbarLink, Icon } from '../../components';
import NewSubscriptionModal from '../payments/subscription/NewSubscriptionModal';
import VPNBlackFridayModal from '../payments/subscription/VPNBlackFridayModal';
import MailBlackFridayModal from '../payments/subscription/MailBlackFridayModal';
import { TopNavbarItem } from '../app/TopNavbar';
import { SUBSCRIPTION_STEPS } from '../payments/subscription/constants';

interface Props {
    plans: Plan[];
    subscription: Subscription;
}

const BlackFridayButton = ({ plans, subscription, ...rest }: Props) => {
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const icon = 'blackfriday';
    const cyberModay = useCyberMondayPeriod();
    const text = isProductPayer(subscription)
        ? c('blackfriday Promo title, need to be short').t`Special offer`
        : cyberModay
        ? 'Cyber Monday'
        : 'Black Friday';

    const onSelect = ({
        planIDs,
        cycle,
        currency,
        couponCode,
    }: {
        planIDs: PlanIDs;
        cycle: Cycle;
        currency: Currency;
        couponCode?: string | null;
    }) => {
        createModal(
            <NewSubscriptionModal
                planIDs={planIDs}
                cycle={cycle}
                currency={currency}
                coupon={couponCode}
                step={SUBSCRIPTION_STEPS.PAYMENT}
            />
        );
    };

    if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
        return (
            <TopNavbarLink
                to="/dashboard"
                toApp={APPS.PROTONVPN_SETTINGS}
                icon={icon}
                text={text}
                onClick={() => {
                    createModal(<VPNBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />);
                }}
                {...rest}
            />
        );
    }

    return (
        <TopNavbarItem>
            <button
                className="topnav-link"
                type="button"
                onClick={() => {
                    createModal(<MailBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />);
                }}
            >
                <Icon className="topnav-icon mr0-5 flex-item-centered-vert" name={icon} />
                <span className="navigation-title topnav-linkText">{text}</span>
            </button>
        </TopNavbarItem>
    );
};

export default BlackFridayButton;
