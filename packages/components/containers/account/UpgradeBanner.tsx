import { ReactNode } from 'react';
import { c } from 'ttag';
import { Audience } from '@proton/shared/lib/interfaces';
import { PLANS } from '@proton/shared/lib/constants';
import { ButtonLike, Card, SettingsLink } from '../../components';
import { classnames } from '../../helpers';

interface Props {
    children: ReactNode;
    className?: string;
    audience?: Audience;
    free?: boolean;
}

const UpgradeBanner = ({ free, className, children, audience }: Props) => {
    return (
        <Card className={classnames(['flex flex-align-items-center', className])} rounded>
            <p className="m0 mr2 flex-item-fluid">{children}</p>
            <ButtonLike
                as={SettingsLink}
                path={(() => {
                    if (!free && audience === Audience.B2B) {
                        return `/dashboard?plan=${PLANS.BUNDLE_PRO}&target=compare`;
                    }
                    if (audience === Audience.B2B) {
                        return '/upgrade?business';
                    }
                    return '/upgrade';
                })()}
                color="norm"
                className="mtauto"
            >{c('Action').t`Upgrade`}</ButtonLike>
        </Card>
    );
};

export default UpgradeBanner;
