import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import AppLink from '@proton/components/components/link/AppLink';
import { APPS } from '@proton/shared/lib/constants';

import { UpgradeBanner } from './UpgradeBanner';

export const FreeUpgradeBanner = () => {
    return (
        <UpgradeBanner
            title={c('Info').t`Your plan is limited to 10 versions for up to 7 days`}
            button={
                <ButtonLike
                    as={AppLink}
                    to="/drive/upgrade"
                    toApp={APPS.PROTONACCOUNT}
                    className="my-1"
                    color="norm"
                    size="small"
                >
                    {c('Action').t`Upgrade`}
                </ButtonLike>
            }
        />
    );
};
