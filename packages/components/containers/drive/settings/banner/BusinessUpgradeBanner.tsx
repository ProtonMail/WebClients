import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import { UpgradeBanner } from './UpgradeBanner';

export const BusinessUpgradeBanner = () => {
    return (
        <UpgradeBanner
            title={c('Info').t`For a 10-year version history, please contact our sales team.`}
            button={
                <ButtonLike
                    as="a"
                    href={getStaticURL(`/business/contact?pd=drive&int=enterprise&ref=versionhistory`)}
                    className="my-1"
                    color="norm"
                    size="small"
                >
                    {c('Action').t`Contact sales`}
                </ButtonLike>
            }
        />
    );
};
