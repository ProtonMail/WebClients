import React, { ReactNode } from 'react';
import { c } from 'ttag';
import { ButtonLike, Card, SettingsLink } from '../../components';

interface Props {
    children: ReactNode;
}

const UpgradeBanner = ({ children }: Props) => {
    return (
        <Card className="flex flex-align-items-center">
            <p className="m0 mr2 flex-item-fluid">{children}</p>
            <ButtonLike as={SettingsLink} path="/dashboard" color="norm" className="mtauto">{c('Action')
                .t`Upgrade`}</ButtonLike>
        </Card>
    );
};

export default UpgradeBanner;
