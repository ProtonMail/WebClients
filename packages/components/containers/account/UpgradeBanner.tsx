import { ReactNode } from 'react';
import { c } from 'ttag';
import { ButtonLike, Card, SettingsLink } from '../../components';
import { classnames } from '../../helpers';

interface Props {
    children: ReactNode;
    className?: string;
}

const UpgradeBanner = ({ className, children }: Props) => {
    return (
        <Card className={classnames(['flex flex-align-items-center', className])}>
            <p className="m0 mr2 flex-item-fluid">{children}</p>
            <ButtonLike as={SettingsLink} path="/dashboard" color="norm" className="mtauto">{c('Action')
                .t`Upgrade`}</ButtonLike>
        </Card>
    );
};

export default UpgradeBanner;
