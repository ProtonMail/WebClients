import { ReactNode } from 'react';
import { c } from 'ttag';
import { Audience } from '@proton/shared/lib/interfaces';
import { ButtonLike, Card, SettingsLink } from '../../components';
import { classnames } from '../../helpers';

interface Props {
    children: ReactNode;
    className?: string;
    audience?: Audience;
}

const UpgradeBanner = ({ className, children, audience }: Props) => {
    return (
        <Card className={classnames(['flex flex-align-items-center', className])} rounded>
            <p className="m0 mr2 flex-item-fluid">{children}</p>
            <ButtonLike
                as={SettingsLink}
                path={`/upgrade${audience === Audience.B2B ? `?business` : ''}`}
                color="norm"
                className="mtauto"
            >{c('Action').t`Upgrade`}</ButtonLike>
        </Card>
    );
};

export default UpgradeBanner;
