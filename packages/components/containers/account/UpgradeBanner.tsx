import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Card } from '@proton/atoms/Card/Card';
import { PLANS } from '@proton/payments/core/constants';
import { getUpgradePath } from '@proton/payments/core/subscription/upsell';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';
import clsx from '@proton/utils/clsx';

import SettingsLink from '../../components/link/SettingsLink';
import { useBundleProPlan } from '../../hooks/useHasPlan';
import { PromotionBanner } from '../banner/PromotionBanner';

interface Props {
    children: ReactNode;
    className?: string;
    audience?: Audience;
    upsellPath?: string;
    /** Shows a promotion banner, as in the Mail settings card layout, instead of a card. */
    promotion?: boolean;
}

const UpgradeBanner = ({ className, children, audience, upsellPath, promotion = false }: Props) => {
    const [user] = useUser();
    const bundleProPlan = useBundleProPlan();

    const upgradePath = getUpgradePath(
        {
            user,
            plan: audience === Audience.B2B ? bundleProPlan : PLANS.BUNDLE,
            audience,
        },
        upsellPath
    );

    if (promotion) {
        return (
            <PromotionBanner
                className={className}
                rounded="xl"
                mode="banner"
                contentCentered={false}
                description={children}
                cta={
                    // Full width when the banner stacks on narrow screens
                    <ButtonLike
                        as={SettingsLink}
                        path={upgradePath}
                        color="norm"
                        fullWidth
                        aria-label={c('Action').t`Upgrade your plan`}
                    >{c('Action').t`Upgrade`}</ButtonLike>
                }
            />
        );
    }

    return (
        <Card className={clsx(['flex items-center', className])} rounded>
            <p className="m-0 mr-8 flex-1">{children}</p>
            <ButtonLike
                as={SettingsLink}
                path={upgradePath}
                color="norm"
                className="mt-auto"
                aria-label={c('Action').t`Upgrade your plan`}
            >{c('Action').t`Upgrade`}</ButtonLike>
        </Card>
    );
};

export default UpgradeBanner;
