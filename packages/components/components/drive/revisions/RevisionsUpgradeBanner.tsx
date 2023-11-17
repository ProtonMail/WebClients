import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { AppLink } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

const RevisionsUpgradeBanner = () => {
    return (
        <div
            className="bg-weak p-4 rounded flex items-center justify-space-between"
            data-testid="revisions-upgrade-banner"
        >
            <p className="mx-0 my-1">{c('Info').t`Your plan is limited to 10 versions for up to 7 days`}</p>
            <ButtonLike
                className="my-1"
                as={AppLink}
                to="/drive/upgrade"
                toApp={APPS.PROTONACCOUNT}
                color="norm"
                size="small"
            >{c('Action').t`Upgrade`}</ButtonLike>
        </div>
    );
};

export default RevisionsUpgradeBanner;
