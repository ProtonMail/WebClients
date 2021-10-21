import { c } from 'ttag';
import { APPS } from '@proton/shared/lib/constants';
import { PlanIDs, Cycle, Currency } from '@proton/shared/lib/interfaces';

import { useModals, useConfig } from '../../hooks';
import { Icon } from '../../components';
import SubscriptionModal from '../payments/subscription/SubscriptionModal';
import { SUBSCRIPTION_STEPS } from '../payments/subscription/constants';
import { EligibleOffer } from '../payments/interface';
import TopNavbarListItemButton, {
    TopNavbarListItemButtonProps,
} from '../../components/topnavbar/TopNavbarListItemButton';
import { BlackFridayModal } from '../payments';

interface Props extends Omit<TopNavbarListItemButtonProps<'button'>, 'icon' | 'text' | 'as'> {
    offer: EligibleOffer;
}

const TopNavbarListItemBlackFridayButton = ({ offer }: Props) => {
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const hasRedDot = isVPN || offer.name === 'black-friday';
    const text = c('blackfriday: VPNspecialoffer Promo title, need to be short').t`Special offer`;

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
                disableBackButton
            />
        );
    };

    return (
        <TopNavbarListItemButton
            as="button"
            type="button"
            title={text}
            hasRedDot={hasRedDot}
            icon={<Icon name="bag-percent" />}
            text={text}
            onClick={() => {
                createModal(<BlackFridayModal offer={offer} onSelect={onSelect} />);
            }}
        />
    );
};

export default TopNavbarListItemBlackFridayButton;
