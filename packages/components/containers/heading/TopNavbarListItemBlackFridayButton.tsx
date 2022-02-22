import { c } from 'ttag';
import { APPS } from '@proton/shared/lib/constants';

import { useModals, useConfig } from '../../hooks';
import { Icon, useSettingsLink } from '../../components';
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
    const settingsLink = useSettingsLink();

    return (
        <TopNavbarListItemButton
            as="button"
            type="button"
            title={text}
            hasRedDot={hasRedDot}
            icon={<Icon name="bag-percent" />}
            text={text}
            onClick={() => {
                createModal(
                    <BlackFridayModal
                        offer={offer}
                        onSelect={({ offer, plan, cycle, currency, couponCode }) => {
                            const params = new URLSearchParams();
                            params.set('cycle', `${cycle}`);
                            params.set('currency', currency);
                            if (couponCode) {
                                params.set('coupon', couponCode);
                            }
                            params.set('plan', plan);
                            params.set('type', 'offer');
                            params.set('edit', 'disable');
                            params.set('offer', offer.name);
                            settingsLink(`/dashboard?${params.toString()}`);
                        }}
                    />
                );
            }}
        />
    );
};

export default TopNavbarListItemBlackFridayButton;
