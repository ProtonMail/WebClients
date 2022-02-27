import { hasVpnBasic } from '@proton/shared/lib/helpers/subscription';
import { c } from 'ttag';
import { Subscription, UserModel } from '@proton/shared/lib/interfaces';
import { Button, Card } from '../../../components';
import UpsellItem from './UpsellItem';

interface Props {
    subscription: Subscription;
    user: UserModel;
    onUpgrade: () => void;
}

const UpsellVPNSubscription = ({ subscription, user, onUpgrade }: Props) => {
    const isFreeVpn = !user.hasPaidVpn;

    if (!isFreeVpn && !hasVpnBasic(subscription)) {
        return null;
    }

    return (
        <Card rounded border={false} className="mt1-5">
            <UpsellItem icon="rocket">{c('VPN upsell feature').t`Higher speed servers (up to 10Gbps)`}</UpsellItem>
            <UpsellItem icon="presentation-screen">
                {c('VPN upsell feature').t`Access geo-blocked content (Netflix, YouTube, etc.)`}
            </UpsellItem>
            <UpsellItem icon="brand-proton-vpn">{c('VPN upsell feature').t`Unlock advanced VPN features`}</UpsellItem>
            <Button color="norm" className="mt1" onClick={onUpgrade}>
                {c('Action').t`Upgrade to Plus`}
            </Button>
        </Card>
    );
};

export default UpsellVPNSubscription;
