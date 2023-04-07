import { DRIVE_PRICING_PAGE } from 'proton-drive/src/app/constants/urls';
import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';

const RevisionsUpgradeBanner = () => {
    return (
        <div className="bg-weak py-4 px-4 rounded flex flex-align-items-center flex-justify-space-between">
            <p className="m0 my-1">{c('Info').t`Upgrade to extended version history beyond 7 days`}</p>
            <ButtonLike className="my-1" as="a" href={DRIVE_PRICING_PAGE} color="norm" size="small">{c('Action')
                .t`Upgrade`}</ButtonLike>
        </div>
    );
};

export default RevisionsUpgradeBanner;
