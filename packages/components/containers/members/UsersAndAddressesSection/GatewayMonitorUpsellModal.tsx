import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcServers } from '@proton/icons/icons/IcServers';
import { IcUser } from '@proton/icons/icons/IcUser';
import { ADDON_NAMES, CYCLE } from '@proton/payments/core/constants';
import { getPricePerCycle } from '@proton/payments/core/price-helpers';
import gatewayMonitorUpsellHero from '@proton/styles/assets/img/vpn/users/users-upsell-hero.jpg';

import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import { ModalHeaderCloseButton } from '../../../components/modalTwo/ModalHeader';
import type { ModalStateProps } from '../../../components/modalTwo/useModalState';
import { getSimplePriceString } from '../../../components/price/helper';
import { usePreferredPlansMap } from '../../../hooks/usePreferredPlansMap';

interface Props {
    modalProps: ModalStateProps;
    onUpgrade: () => void;
    upgradeLoading?: boolean;
}

const GatewayMonitorPricing = () => {
    const { plansMap, preferredCurrency } = usePreferredPlansMap();

    const monthlyAddonPrice = (addonName: ADDON_NAMES) => {
        const yearlyTotal = getPricePerCycle(plansMap[addonName], CYCLE.YEARLY);
        if (yearlyTotal === undefined) {
            return undefined;
        }
        return getSimplePriceString(preferredCurrency, yearlyTotal / CYCLE.YEARLY, c('Suffix').t`/month`);
    };

    const userPrice = monthlyAddonPrice(ADDON_NAMES.MEMBER_VPN_BUSINESS);
    const serverPrice = monthlyAddonPrice(ADDON_NAMES.IP_VPN_BUSINESS);

    if (!userPrice || !serverPrice) {
        return null;
    }

    return (
        <div className="flex flex-nowrap justify-center gap-4 text-sm color-weak">
            <span className="inline-flex flex-nowrap items-center gap-1">
                <IcUser size={4} />
                {
                    // translator: ${userPrice} is a formatted per-month price such as "€9.99/month"
                    c('Gateway monitor upsell').t`User - ${userPrice}`
                }
            </span>
            <span className="inline-flex flex-nowrap items-center gap-1">
                <IcServers size={4} />
                {c('Gateway monitor upsell').t`Dedicated server - ${serverPrice}`}
            </span>
        </div>
    );
};

const GatewayMonitorUpsellModal = ({ modalProps, onUpgrade, upgradeLoading }: Props) => {
    const features = [
        {
            title: c('Gateway monitor upsell').t`Real-time connection insights`,
            description: c('Gateway monitor upsell')
                .t`Get real-time connection insights, monitor suspicious activity and export data to SIEM tools for your private gateways`,
        },
        {
            title: c('Gateway monitor upsell').t`Enforce identity-based access controls`,
            description: c('Gateway monitor upsell')
                .t`In addition to connection monitoring, private gateways let you grant access by user or group - all running on dedicated servers with static IPs.`,
        },
        {
            title: c('Gateway monitor upsell').t`Advanced security controls`,
            description: c('Gateway monitor upsell')
                .t`Unlock Single-Sign-on (SSO), admin policies, monitoring, enforced two-factor authentication and more.`,
        },
    ];

    return (
        <ModalTwo {...modalProps} size="large">
            <ModalTwoContent unstyled>
                <div className="relative">
                    <ModalHeaderCloseButton buttonProps={{ className: 'absolute right-0 top-0 mt-3 mr-3' }} />
                    <img src={gatewayMonitorUpsellHero} alt="" className="w-full" />
                </div>
                <div className="p-8 flex flex-column gap-6">
                    <h1 className="text-2xl text-bold text-center">
                        {c('Gateway monitor upsell').t`Monitor gateway connections with VPN Professional`}
                    </h1>

                    <ul className="unstyled m-0 flex flex-column gap-4">
                        {features.map((feature) => (
                            <li key={feature.title} className="flex flex-nowrap gap-3">
                                <IcCheckmarkCircleFilled className="shrink-0 mt-0.5 color-success" size={5} />
                                <div>
                                    <p className="m-0 text-bold">{feature.title}</p>
                                    <p className="m-0 color-weak">{feature.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-column gap-2">
                        <Button color="norm" fullWidth loading={upgradeLoading} onClick={onUpgrade}>
                            {c('Action').t`Upgrade to Professional`}
                        </Button>
                        <Button fullWidth onClick={modalProps.onClose}>
                            {c('Action').t`Cancel`}
                        </Button>
                    </div>

                    <GatewayMonitorPricing />
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default GatewayMonitorUpsellModal;
