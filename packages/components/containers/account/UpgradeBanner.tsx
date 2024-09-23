import type { ReactNode } from 'react';

import { c } from 'ttag';

import { ButtonLike, Card } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { useSubscription, useUser } from '@proton/components/hooks';
import { useBundleProPlan } from '@proton/components/hooks/useHasPlan';
import { PLANS } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';
import { Audience } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

interface Props {
    children: ReactNode;
    className?: string;
    audience?: Audience;
    upsellPath?: string;
}

const UpgradeBanner = ({ className, children, audience, upsellPath }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const bundleProPlan = useBundleProPlan();

    return (
        <Card className={clsx(['flex items-center', className])} rounded>
            <p className="m-0 mr-8 flex-1">{children}</p>
            <ButtonLike
                as={SettingsLink}
                path={(() => {
                    return addUpsellPath(
                        getUpgradePath({
                            user,
                            subscription,
                            plan: audience === Audience.B2B ? bundleProPlan : PLANS.BUNDLE,
                            audience,
                        }),
                        upsellPath
                    );
                })()}
                color="norm"
                className="mt-auto"
                aria-label={c('Action').t`Upgrade your plan`}
            >{c('Action').t`Upgrade`}</ButtonLike>
        </Card>
    );
};

export default UpgradeBanner;
