import { ReactNode } from 'react';

import { c } from 'ttag';

import { ButtonLike, Card } from '@proton/atoms';
import { PLANS } from '@proton/shared/lib/constants';
import { addUpsellPath } from '@proton/shared/lib/helpers/upsell';
import { Audience } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { SettingsLink } from '../../components';

interface Props {
    children: ReactNode;
    className?: string;
    audience?: Audience;
    free?: boolean;
    upsellPath?: string;
}

const UpgradeBanner = ({ free, className, children, audience, upsellPath }: Props) => {
    return (
        <Card className={clsx(['flex flex-align-items-center', className])} rounded>
            <p className="m-0 mr-8 flex-item-fluid">{children}</p>
            <ButtonLike
                as={SettingsLink}
                path={(() => {
                    if (!free && audience === Audience.B2B) {
                        return addUpsellPath(`/dashboard?plan=${PLANS.BUNDLE_PRO}&target=compare`, upsellPath);
                    }
                    if (audience === Audience.B2B) {
                        return addUpsellPath('/upgrade?business', upsellPath);
                    }
                    return addUpsellPath('/upgrade', upsellPath);
                })()}
                color="norm"
                className="mt-auto"
                aria-label={c('Action').t`Upgrade your plan`}
            >{c('Action').t`Upgrade`}</ButtonLike>
        </Card>
    );
};

export default UpgradeBanner;
