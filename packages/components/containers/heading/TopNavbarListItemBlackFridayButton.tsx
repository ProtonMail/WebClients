import React from 'react';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';
import { PlanIDs, Cycle, Currency, Subscription, Plan } from 'proton-shared/lib/interfaces';
import { isProductPayer } from 'proton-shared/lib/helpers/blackfriday';

import { useModals, useConfig, useCyberMondayPeriod, useUser } from '../../hooks';
import { Icon } from '../../components';
import SubscriptionModal from '../payments/subscription/SubscriptionModal';
import VPNBlackFridayModal from '../payments/subscription/VPNBlackFridayModal';
import MailBlackFridayModal from '../payments/subscription/MailBlackFridayModal';
import { SUBSCRIPTION_STEPS } from '../payments/subscription/constants';
import TopNavbarListItemButton, {
    TopNavbarListItemButtonProps,
} from '../../components/topnavbar/TopNavbarListItemButton';

interface Props extends Omit<TopNavbarListItemButtonProps<'button'>, 'icon' | 'text' | 'as'> {
    plans: Plan[];
    subscription: Subscription;
}

const TopNavbarListItemBlackFridayButton = ({ plans, subscription }: Props) => {
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const [user] = useUser();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const hasRedDot = isVPN || user.isFree; // Is vpn app or have BF2020 free promo
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
            <SubscriptionModal
                planIDs={planIDs}
                cycle={cycle}
                currency={currency}
                coupon={couponCode}
                step={SUBSCRIPTION_STEPS.CHECKOUT}
            />
        );
    };

    return (
        <TopNavbarListItemButton
            as="button"
            type="button"
            title={text}
            hasRedDot={hasRedDot}
            icon={<Icon name="blackfriday" />}
            text={text}
            onClick={() => {
                if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
                    createModal(<VPNBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />);
                    return;
                }
                createModal(<MailBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />);
            }}
        />
    );
};

export default TopNavbarListItemBlackFridayButton;
